export interface PreventionMeasure {
  measure: string;
  rationale: string;
  category: 'Environment' | 'Physical' | 'Medication' | 'Care' | 'Other';
}

export interface FallAnalysis {
  detectedTextSummary: string;
  possibleCauses: string[];
  preventionStrategies: PreventionMeasure[];
  handoverNote: string; // The "Copy to Logbook" text
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
