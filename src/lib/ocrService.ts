import { createWorker, type Worker } from 'tesseract.js';
import { supabase } from '@/integrations/supabase/client';

export interface BioimpedanceExtractedData {
  weight: number | null;
  bodyFatPct: number | null;
  muscleMass: number | null;
  visceralFat: number | null;
  bmr: number | null;
  bodyWaterPct: number | null;
  boneMass: number | null;
}

// Ranges de validação para cada métrica
const VALID_RANGES: Record<string, [number, number]> = {
  weight: [20, 300],
  bodyFatPct: [2, 60],
  muscleMass: [5, 100],
  visceralFat: [1, 30],
  bmr: [500, 5000],
  bodyWaterPct: [20, 80],
  boneMass: [0.5, 10],
};

function isValidRange(value: number | null, key: string): boolean {
  if (value === null || value === undefined || isNaN(value)) return false;
  const range = VALID_RANGES[key];
  if (!range) return true;
  return value >= range[0] && value <= range[1];
}

function sanitize(value: number | null, key: string): number | null {
  if (value === null || value === undefined || isNaN(value)) return null;
  return isValidRange(value, key) ? Math.round(value * 10) / 10 : null;
}

/**
 * Serviço de OCR Híbrido para extração de dados de Composição Corporal
 * Utiliza Tesseract.js (Local) + Gemini AI (Supabase Edge Function) simultaneamente
 * Com validação de sanidade para evitar valores absurdos
 */
export const ocrService = {
  async extractFromImage(imageBuffer: string | File): Promise<BioimpedanceExtractedData> {
    console.log('Iniciando OCR Híbrido...');

    let base64Image = '';
    if (imageBuffer instanceof File) {
      base64Image = await this.fileToBase64(imageBuffer);
    } else {
      base64Image = imageBuffer;
    }

    // Dispara as duas opções em paralelo
    const tesseractPromise = this.extractLocal(imageBuffer);
    const aiPromise = this.extractWithAI(base64Image);

    try {
      const [localResults, aiResults] = await Promise.all([
        tesseractPromise.catch(e => { console.error('Tesseract failed:', e); return null; }),
        aiPromise.catch(e => { console.error('Gemini AI failed:', e); return null; })
      ]);

      console.log('Resultados Local (raw):', localResults);
      console.log('Resultados IA (raw):', aiResults);

      // Merge com validação: IA prioridade, mas só se o valor for válido
      const merged = {
        weight: this.pickBest(aiResults?.weight, localResults?.weight, 'weight'),
        bodyFatPct: this.pickBest(aiResults?.bodyFatPct, localResults?.bodyFatPct, 'bodyFatPct'),
        muscleMass: this.pickBest(aiResults?.muscleMass, localResults?.muscleMass, 'muscleMass'),
        visceralFat: this.pickBest(aiResults?.visceralFat, localResults?.visceralFat, 'visceralFat'),
        bmr: this.pickBest(aiResults?.bmr, localResults?.bmr, 'bmr'),
        bodyWaterPct: this.pickBest(aiResults?.bodyWaterPct, localResults?.bodyWaterPct, 'bodyWaterPct'),
        boneMass: this.pickBest(aiResults?.boneMass, localResults?.boneMass, 'boneMass'),
      };

      console.log('Resultados finais (validados):', merged);
      return merged;
    } catch (error) {
      console.error('Erro no processamento OCR:', error);
      throw error;
    }
  },

  /** Escolhe o melhor valor entre IA e local, validando ambos */
  pickBest(aiValue: number | null | undefined, localValue: number | null | undefined, key: string): number | null {
    const ai = aiValue != null ? sanitize(aiValue, key) : null;
    const local = localValue != null ? sanitize(localValue, key) : null;

    // IA tem prioridade se válido
    if (ai !== null) return ai;
    // Fallback para local se válido
    if (local !== null) return local;
    return null;
  },

  async extractLocal(imageBuffer: string | File): Promise<BioimpedanceExtractedData> {
    let worker: Worker | null = null;
    try {
      console.log('Inicializando Tesseract Worker...');
      worker = await createWorker('por');
      const { data: { text } } = await worker.recognize(imageBuffer);
      console.log('Texto extraído pelo Tesseract:', text);
      return this.parseText(text);
    } catch (error) {
      console.error('Falha crítica no Tesseract Worker:', error);
      throw new Error('Não foi possível processar a imagem localmente.');
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  },

  async extractWithAI(base64Image: string): Promise<BioimpedanceExtractedData | null> {
    const { data, error } = await supabase.functions.invoke('extract-bioimpedance-ai', {
      body: { image: base64Image },
    });
    if (error) throw error;
    return data;
  },

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  parseText(text: string): BioimpedanceExtractedData {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    /**
     * Procura um valor numérico em linhas que contenham uma das keywords.
     * Pega TODOS os números da linha e retorna o que estiver dentro do range válido.
     * Se houver um número com casas decimais (ex: 20.5), prioriza sobre inteiro.
     */
    const findValue = (keywords: string[], rangeKey: string): number | null => {
      const range = VALID_RANGES[rangeKey];
      if (!range) return null;

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (!keywords.some(kw => lowerLine.includes(kw.toLowerCase()))) continue;

        // Captura todos os números da linha (com ou sem decimal)
        const allNumbers = line.match(/(\d+[.,]\d+|\d+)/g);
        if (!allNumbers) continue;

        // Converte todos e filtra os que estão no range válido
        const parsed = allNumbers
          .map(n => parseFloat(n.replace(',', '.')))
          .filter(n => !isNaN(n) && n >= range[0] && n <= range[1]);

        // Prioriza números com decimal (mais específicos)
        const withDecimal = parsed.filter(n => n % 1 !== 0);
        if (withDecimal.length > 0) return withDecimal[0];
        if (parsed.length > 0) return parsed[0];
      }
      return null;
    };

    return {
      weight: findValue(['Peso', 'Weight', 'Peso Corporal', 'Body Weight'], 'weight'),
      bodyFatPct: findValue(['% Gordura', 'Gordura Corporal', 'Percent. Gordura', 'Body Fat', 'Fat %', 'PGC', 'Perc. Gordura'], 'bodyFatPct'),
      muscleMass: findValue(['Massa Muscular', 'Músculo Esquelético', 'Musc. Esquelética', 'Muscle Mass', 'Skeletal Muscle', 'MM', 'MME'], 'muscleMass'),
      visceralFat: findValue(['Visceral', 'Gord. Visceral', 'Gordura Visceral', 'Visceral Fat', 'GV', 'Nível Visceral'], 'visceralFat'),
      bmr: findValue(['TMB', 'BMR', 'Taxa Metabólica', 'Taxa Metab', 'Metabolismo Basal', 'Basal', 'Kcal', 'Gasto Calórico'], 'bmr'),
      bodyWaterPct: findValue(['Água', 'Water', 'Hidratação', 'H2O', 'Água Corporal'], 'bodyWaterPct'),
      boneMass: findValue(['Óssea', 'Bone', 'Massa Óssea', 'Bone Mass'], 'boneMass'),
    };
  }
};
