export enum IngredientCategory {
  HEALTHY = 'HEALTHY',
  NEUTRAL = 'NEUTRAL',
  CAUTION = 'CAUTION',
  UNHEALTHY = 'UNHEALTHY'
}

export enum ChildSuitabilityStatus {
  SAFE = 'SAFE',
  MODERATE = 'MODERATE',
  AVOID = 'AVOID'
}

export interface IngredientItem {
  name: string;
  description: string; // Simple explanation
  category: IngredientCategory;
}

export interface ChildSuitability {
  status: ChildSuitabilityStatus;
  reason: string;
}

export interface AnalysisResult {
  productName: string;
  summary: string;
  healthScore: number; // 0-100
  ingredients: IngredientItem[];
  warnings: string[];
  pros: string[];
  childSuitability: ChildSuitability;
}

export type ViewState = 'HOME' | 'PREVIEW' | 'ANALYZING' | 'RESULT';
