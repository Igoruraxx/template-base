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

    const prompt = `Você é um especialista em leitura de relatórios de composição corporal de apps/balanças de bioimpedância como Fitdays, InBody, Omron, Tanita.

O relatório geralmente tem uma tabela com colunas "Indicador | Valor | Mapeq" ou similar.

Analise a imagem e extraia EXATAMENTE estes 5 valores:

1. **weight** = "Peso" ou "Peso corporal" (em kg). Exemplo: 90.9, 96.7, 81.3
2. **bodyFatPct** = "Gordura corporal" (em %). Este é o PERCENTUAL, NÃO a "Massa gorda" que é em kg. No Fitdays aparece como "Gordura corporal" com valor tipo 37.9%, 19.9%, 33.0%. Faixa válida: 3-60%
3. **muscleMass** = "Massa muscular" (em kg), NÃO confundir com "Massa musc. esquelética" que é em %. No Fitdays "Massa muscular" tem valor em kg como 52.8, 72.3, 50.8. Faixa válida: 10-100kg
4. **visceralFat** = "Gordura visceral" (nível sem unidade). Valores típicos: 1-30. Ex: 15.0, 6.0, 11.0
5. **bmr** = "Metabolismo basal" ou "TMB" ou "BMR" (em kcal). Valores típicos: 800-3500. Ex: 1590, 2043, 1547

CUIDADO - Erros comuns a evitar:
- "Gordura corporal" (%) é DIFERENTE de "Massa gorda" (kg). Eu quero "Gordura corporal" que é o PERCENTUAL.
- "Massa muscular" (kg) é DIFERENTE de "Massa musc. esquelética" (%). Eu quero "Massa muscular" que é em KG.
- "Peso" é o peso total corporal, não confundir com "Massa magra" ou "Massa gorda".
- Se não conseguir identificar um campo com certeza, retorne null.

Retorne SOMENTE um JSON puro (sem markdown, sem explicações, sem texto antes ou depois):
{"weight":number|null,"bodyFatPct":number|null,"muscleMass":number|null,"visceralFat":number|null,"bmr":number|null}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: image.split(',')[1]
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.0,
          maxOutputTokens: 200,
        }
      })
    });

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Limpar markdown e parsear JSON
    let jsonString = textResponse.replace(/```json|```/g, '').trim();
    // Tentar extrair JSON de dentro de texto se necessário
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonString = jsonMatch[0];

    const data = JSON.parse(jsonString);

    // Validação de sanidade dos valores extraídos
    const validated = {
      weight: isValidRange(data.weight, 20, 300) ? round(data.weight) : null,
      bodyFatPct: isValidRange(data.bodyFatPct, 2, 60) ? round(data.bodyFatPct) : null,
      muscleMass: isValidRange(data.muscleMass, 5, 100) ? round(data.muscleMass) : null,
      visceralFat: isValidRange(data.visceralFat, 1, 30) ? round(data.visceralFat) : null,
      bmr: isValidRange(data.bmr, 500, 5000) ? Math.round(data.bmr) : null,
    };

    console.log('Gemini raw:', data, '-> validated:', validated);

    return new Response(JSON.stringify(validated), {
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

function isValidRange(value: unknown, min: number, max: number): boolean {
  if (value === null || value === undefined) return false;
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

function round(value: number): number {
  return Math.round(Number(value) * 10) / 10;
}
