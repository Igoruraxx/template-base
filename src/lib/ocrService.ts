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

/**
 * Serviço de OCR Híbrido para extração de dados de Bioimpedância
 * Utiliza Tesseract.js (Local) + Gemini AI (Supabase Edge Function) simultaneamente
 */
export const ocrService = {
  async extractFromImage(imageBuffer: string | File): Promise<BioimpedanceExtractedData> {
    console.log('Iniciando OCR Híbrido...');
    
    // Converte File para base64 se necessário para a API
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

      console.log('Resultados Local:', localResults);
      console.log('Resultados IA:', aiResults);

      // Merge de resultados: IA tem prioridade por ser "sem falhas"
      // Se a IA falhar, usamos o Local. Se ambos funcionarem, a IA decide.
      return {
        weight: aiResults?.weight ?? localResults?.weight ?? null,
        bodyFatPct: aiResults?.bodyFatPct ?? localResults?.bodyFatPct ?? null,
        muscleMass: aiResults?.muscleMass ?? localResults?.muscleMass ?? null,
        visceralFat: aiResults?.visceralFat ?? localResults?.visceralFat ?? null,
        bmr: aiResults?.bmr ?? localResults?.bmr ?? null,
        bodyWaterPct: aiResults?.bodyWaterPct ?? localResults?.bodyWaterPct ?? null,
        boneMass: aiResults?.boneMass ?? localResults?.boneMass ?? null,
      };
    } catch (error) {
      console.error('Erro no processamento OCR:', error);
      throw error;
    }
  },

  async extractLocal(imageBuffer: string | File): Promise<BioimpedanceExtractedData> {
    let worker: Worker | null = null;
    try {
      console.log('Inicializando Tesseract Worker...');
      worker = await createWorker('por');
      const { data: { text } } = await worker.recognize(imageBuffer);
      return this.parseText(text);
    } catch (error) {
      console.error('Falha crítica no Tesseract Worker:', error);
      throw new Error('Não foi possível processar a imagem localmente. Verifique as permissões do navegador.');
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
    const lines = text.split('\n');
    const findValue = (keywords: string[]): number | null => {
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (keywords.some(kw => lowerLine.includes(kw.toLowerCase()))) {
          const matches = line.match(/(\d+[.,]\d+)|(\d+)/g);
          if (matches) {
            const val = parseFloat(matches[0].replace(',', '.'));
            if (!isNaN(val)) return val;
          }
        }
      }
      return null;
    };

    return {
      weight: findValue(['Peso', 'Weight', 'Kg']),
      bodyFatPct: findValue(['Gordura', 'Fat', '%']),
      muscleMass: findValue(['Massa Muscular', 'Músculo', 'Muscle', 'MM']),
      visceralFat: findValue(['Visceral', 'GV', 'Gord. Visc']),
      bmr: findValue(['TMB', 'BMR', 'Taxa Metab', 'Kcal']),
      bodyWaterPct: findValue(['Água', 'Water', 'Hidrata', 'H2O']),
      boneMass: findValue(['Óssea', 'Bone', 'Massa Óssea']),
    };
  }
};
