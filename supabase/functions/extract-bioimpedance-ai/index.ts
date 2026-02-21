import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    if (!image) throw new Error('Image is required');

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) throw new Error('GEMINI_API_KEY is not set');

    const prompt = `
      Você é um especialista em ler relatórios de bioimpedância (InBody, Tanita, etc).
      Analise a imagem fornecida e extraia os seguintes valores numéricos.
      Retorne APENAS um JSON puro no formato abaixo, sem explicações:
      {
        "weight": number,
        "bodyFatPct": number,
        "muscleMass": number,
        "visceralFat": number,
        "bmr": number,
        "bodyWaterPct": number,
        "boneMass": number
      }
      Se não encontrar um valor, use null.
    `;

    // Chamada para a API do Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: image.split(',')[1] // Remove o data:image/jpeg;base64,
              }
            }
          ]
        }]
      })
    });

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Limpar o texto para garantir que seja um JSON válido (remover markdown de código se houver)
    const jsonString = textResponse.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonString);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Gemini OCR error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
