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

    const prompt = `Você é um especialista em leitura de relatórios de composição corporal de balanças de bioimpedância (InBody, Omron, Tanita, Balmak, Wiso, etc).

Analise CUIDADOSAMENTE a imagem. Identifique e extraia APENAS estes 5 valores:

1. **Peso corporal total** (em kg) - geralmente o valor mais destacado, entre 30 e 250 kg
2. **Percentual de gordura corporal** (%) - valor entre 3% e 60%, NÃO confundir com massa de gordura em kg
3. **Massa muscular esquelética** (em kg) - valor entre 10 e 80 kg, pode aparecer como "massa muscular", "músculo esquelético", "skeletal muscle"
4. **Gordura visceral** - nível/índice entre 1 e 30, pode aparecer como número inteiro
5. **Taxa metabólica basal / TMB / BMR** (em kcal) - valor entre 800 e 3500 kcal

REGRAS IMPORTANTES:
- O percentual de gordura é SEMPRE um valor entre 3 e 60. Se você encontrar algo acima de 60 como "gordura", provavelmente é massa de gordura em kg e NÃO o percentual.
- Diferencie entre "massa de gordura" (em kg) e "percentual de gordura" (em %). Eu quero o PERCENTUAL.
- O peso fica normalmente entre 40 e 200 kg para adultos.
- A massa muscular esquelética fica entre 15 e 60 kg para a maioria das pessoas.
- A gordura visceral é geralmente um nível de 1 a 30 (sem unidade).
- O TMB/BMR fica entre 800 e 3500 kcal.
- Se não encontrar um valor com certeza, retorne null. É melhor retornar null do que um valor errado.

Retorne APENAS um JSON puro, sem markdown, sem explicações:
{"weight": number|null, "bodyFatPct": number|null, "muscleMass": number|null, "visceralFat": number|null, "bmr": number|null}`;

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
          temperature: 0.1,
          maxOutputTokens: 256,
        }
      })
    });

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Limpar markdown e parsear JSON
    const jsonString = textResponse.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonString);

    // Validação de sanidade dos valores extraídos
    const validated = {
      weight: isValidRange(data.weight, 20, 300) ? round(data.weight) : null,
      bodyFatPct: isValidRange(data.bodyFatPct, 2, 60) ? round(data.bodyFatPct) : null,
      muscleMass: isValidRange(data.muscleMass, 5, 100) ? round(data.muscleMass) : null,
      visceralFat: isValidRange(data.visceralFat, 1, 30) ? round(data.visceralFat) : null,
      bmr: isValidRange(data.bmr, 500, 5000) ? Math.round(data.bmr) : null,
    };

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
