import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push helpers
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - base64Url.length % 4) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = '';
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateJWT(vapidPublicKey: string, vapidPrivateKey: string, audience: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: 'mailto:push@fitproagenda.com',
  };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);
  
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65)),
    d: uint8ArrayToBase64Url(privateKeyBytes),
  };

  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsignedToken));

  return `${unsignedToken}.${uint8ArrayToBase64Url(new Uint8Array(signature))}`;
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; tag?: string },
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await generateJWT(vapidPublicKey, vapidPrivateKey, audience);

    const body = JSON.stringify(payload);

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
      },
      body: body,
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription expired, should be removed
      return false;
    }

    return response.ok;
  } catch (e) {
    console.error('Push send error:', e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Current time in Brasília (UTC-3)
    const now = new Date();
    const brasiliaOffset = -3 * 60;
    const brasiliaTime = new Date(now.getTime() + (brasiliaOffset + now.getTimezoneOffset()) * 60000);
    const currentHour = brasiliaTime.getHours();
    const currentMinute = brasiliaTime.getMinutes();
    const today = brasiliaTime.toISOString().split('T')[0];
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Calculate time 15 minutes from now
    const in15 = new Date(brasiliaTime.getTime() + 15 * 60000);
    const in15TimeStr = `${String(in15.getHours()).padStart(2, '0')}:${String(in15.getMinutes()).padStart(2, '0')}`;

    // Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');
    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const expiredEndpoints: string[] = [];
    let sentCount = 0;

    // Group subscriptions by trainer
    const trainerSubs = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      if (!trainerSubs.has(sub.trainer_id)) trainerSubs.set(sub.trainer_id, []);
      trainerSubs.get(sub.trainer_id)!.push(sub);
    }

    for (const [trainerId, subs] of trainerSubs) {
      const dailyHour = subs[0].daily_summary_hour;

      // 1) Daily summary: send if current hour matches trainer preference and minute is 0-4
      if (currentHour === dailyHour && currentMinute < 5) {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('scheduled_time, students(name)')
          .eq('trainer_id', trainerId)
          .eq('scheduled_date', today)
          .order('scheduled_time');

        if (sessions && sessions.length > 0) {
          const lines = sessions.map((s: any) => 
            `${s.scheduled_time?.slice(0, 5)} — ${s.students?.name || 'Aluno'}`
          ).join('\n');
          const body = `📋 Hoje você tem ${sessions.length} aula(s):\n${lines}`;

          for (const sub of subs) {
            const ok = await sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              { title: '📅 Agenda do Dia', body, tag: 'daily-summary' },
              vapidPublicKey, vapidPrivateKey,
            );
            if (!ok) expiredEndpoints.push(sub.endpoint);
            else sentCount++;
          }
        }
      }

      // 2) 15-min reminder: sessions starting in ~15 minutes
      const { data: upcoming } = await supabase
        .from('sessions')
        .select('scheduled_time, students(name)')
        .eq('trainer_id', trainerId)
        .eq('scheduled_date', today)
        .eq('status', 'scheduled')
        .gte('scheduled_time', in15TimeStr + ':00')
        .lt('scheduled_time', in15TimeStr.slice(0, 3) + String(Number(in15TimeStr.slice(3, 5)) + 5).padStart(2, '0') + ':00');

      if (upcoming && upcoming.length > 0) {
        for (const session of upcoming) {
          const name = (session as any).students?.name || 'Aluno';
          for (const sub of subs) {
            const ok = await sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              { title: '⏰ Aula em 15 minutos', body: `${name} tem aula às ${session.scheduled_time?.slice(0, 5)}`, tag: `reminder-${session.scheduled_time}` },
              vapidPublicKey, vapidPrivateKey,
            );
            if (!ok) expiredEndpoints.push(sub.endpoint);
            else sentCount++;
          }
        }
      }

      // 3) Now reminder: sessions starting right now
      const { data: nowSessions } = await supabase
        .from('sessions')
        .select('scheduled_time, students(name)')
        .eq('trainer_id', trainerId)
        .eq('scheduled_date', today)
        .eq('status', 'scheduled')
        .gte('scheduled_time', currentTimeStr + ':00')
        .lt('scheduled_time', currentTimeStr.slice(0, 3) + String(Math.min(59, Number(currentTimeStr.slice(3, 5)) + 5)).padStart(2, '0') + ':00');

      if (nowSessions && nowSessions.length > 0) {
        for (const session of nowSessions) {
          const name = (session as any).students?.name || 'Aluno';
          for (const sub of subs) {
            const ok = await sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              { title: '🏋️ Hora da aula!', body: `Chegou a hora da aula de ${name}!`, tag: `session-now-${session.scheduled_time}` },
              vapidPublicKey, vapidPrivateKey,
            );
            if (!ok) expiredEndpoints.push(sub.endpoint);
            else sentCount++;
          }
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
    }

    return new Response(JSON.stringify({ sent: sentCount, expired: expiredEndpoints.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Push notify error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
