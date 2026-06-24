export interface StartupData {
  name: string;
  author: string;
  expert?: string;
  u1: number;
  u2: number;
  e1: number;
  e2: number;
  r1: number;
  r2: number;
  k1: number;
  k2: number;
  t1: number;
  t2: number;
  s1: number;
  s2: number;
  tam: number;
  sam: number;
  som: number;
  tav: number;
}

export interface FactorInterpretation {
  key: keyof Subfactors;
  name: string;
  weight: number;
  score: number;
  status: 'strong' | 'medium' | 'weak';
  statusLabel: string;
  desc: string;
  advice: string;
}

export interface Subfactors {
  U: number;
  E: number;
  R: number;
  K: number;
  T: number;
  S: number;
}

export interface CalculationResult {
  subfactors: Subfactors;
  rawSsi: number;
  mei: number;
  finalSsi: number;
  interpretation: string;
  color: string;
}

export interface DataWarning {
  field: keyof StartupData | 'market' | 'general';
  level: 'error' | 'warning';
  message: string;
  explanation: string;
}

