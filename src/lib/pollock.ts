export type Sex = 'male' | 'female';

export function calcSumSkinfolds(
  chest: number, axillary: number, triceps: number,
  subscapular: number, abdominal: number, suprailiac: number, thigh: number
): number {
  return chest + axillary + triceps + subscapular + abdominal + suprailiac + thigh;
}

export function calcDensityPollock7(sex: Sex, age: number, sum: number): number {
  if (sex === 'male') {
    return 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age;
  }
  return 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age;
}

export function calcBodyFatSiri(density: number): number {
  return (4.95 / density - 4.50) * 100;
}

export function calcComposition(weight: number, fatPct: number) {
  const fatMass = (fatPct / 100) * weight;
  const leanMass = weight - fatMass;
  return { fat_mass_kg: Math.round(fatMass * 100) / 100, lean_mass_kg: Math.round(leanMass * 100) / 100 };
}
