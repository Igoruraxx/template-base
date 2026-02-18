import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = 'BClygMO-7Z9bvEnwjqZY1bemIMieC-wkxnysiQ6mH0Hi0d9Fqc807DAPM1290JqxPLv0WcKtfo_WFUmssEplxYI';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(dailySummaryHour: number = 4): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const reg = registration as any;
    
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subJson = subscription.toJSON();
    
    const { error } = await supabase.functions.invoke('register-push', {
      body: {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
        daily_summary_hour: dailySummaryHour,
      },
    });

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Push subscription error:', e);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const reg = registration as any;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    }
  } catch (e) {
    console.error('Push unsubscribe error:', e);
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    const registration = await navigator.serviceWorker.ready;
    const reg = registration as any;
    const subscription = await reg.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

export async function updateDailySummaryHour(hour: number): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const reg = registration as any;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await supabase.from('push_subscriptions')
        .update({ daily_summary_hour: hour })
        .eq('endpoint', subscription.endpoint);
    }
  } catch (e) {
    console.error('Update hour error:', e);
  }
}
