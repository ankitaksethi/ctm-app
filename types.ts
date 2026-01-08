
export interface ClinicalTrialRaw {
  protocolSection?: any;
  derivedSection?: any;
  hasResults?: boolean;
  [key: string]: any;
}

export interface FlattenedTrial {
  nctId: string;
  moduleBriefTitle: string;
  moduleOfficialTitle?: string;
  overallStatus: string;
  startDate?: string;
  briefSummary?: string;
  conditions?: string;
  eligibilityMinimumAge: number;
  eligibilityMaximumAge: number;
  eligibilityCriteria?: string;
  master_diagnoses?: string[];
  [key: string]: any;
}

export interface TaxonomySummary {
  Genetic: string[];
  RecentEvents: string[];
  OtherMajorDiagnosis: string[];
}

export interface TaxonomyData {
  summary: TaxonomySummary;
  lookup: Record<string, string>;
}

export type ProcessingStep = 'idle' | 'fetching' | 'categorizing' | 'filtering' | 'results';

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}
