import type { GeneratedAppCandidate } from './app';

export type UserActionKind = 'click' | 'link' | 'submit';

export interface UserAction {
  kind: UserActionKind;
  targetTag: string;
  targetText: string;
  targetDescription: string;
  formValues?: Record<string, string>;
}

export interface LlmHtmlResponse {
  windowTitle: string;
  html: string;
  summary: string;
}

export interface AppSearchResponse {
  results: GeneratedAppCandidate[];
}

export interface AppGenerateResponse extends LlmHtmlResponse {}

export interface AppInteractResponse extends LlmHtmlResponse {}

export interface BrowserNavigateResponse {
  title: string;
  url: string;
  html: string;
  summary: string;
}

export interface BrowserInteractResponse extends BrowserNavigateResponse {}

export interface FrontendApiError {
  message: string;
  status?: number;
  code?: string;
}
