export type SurveyStatus = 'draft' | 'active' | 'closed';

export type QuestionType = 'rating' | 'single' | 'multiple' | 'text';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  maxRating?: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  createdAt: string;
  closesAt: string;
  questions: Question[];
  responses: number;
  completionRate: number;
  avgRating: number;
  channel: string;
  audience: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type View =
  | 'dashboard'
  | 'surveys'
  | 'survey-detail'
  | 'create-survey'
  | 'publish'
  | 'copilot'
  | 'settings';
