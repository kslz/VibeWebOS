import type { GeneratedAppCandidate } from './app';

export type UserActionKind = 'click' | 'link' | 'submit';

export interface UserAction {
  type: UserActionKind;
  targetTag: string;
  targetText: string;
  targetDescription: string;
}

export type FormValues = Record<string, string>;

export interface GeneratedAppInteractionEvent {
  userAction: UserAction;
  formValues: FormValues;
}

export interface WindowLevelLlmContext {
  currentHtml: string;
  currentSummary: string;
  temporaryFormValues: FormValues;
  recentInteractionSummaries: string[];
}

export interface BrowserWindowLevelLlmContext extends WindowLevelLlmContext {
  currentUrl: string;
}

export interface GeneratedAppWindowPayload {
  candidate: GeneratedAppCandidate;
  html: string;
  summary: string;
  context: WindowLevelLlmContext;
}

export interface BrowserWindowPayload {
  pageTitle: string;
  url: string;
  html: string;
  summary: string;
  context: BrowserWindowLevelLlmContext;
}

export interface AppSearchRequest {
  query: string;
}

export interface AppGenerateRequest extends GeneratedAppCandidate {}

export interface AppInteractRequest {
  windowTitle: string;
  currentSummary: string;
  currentHtml: string;
  recentInteractionSummaries: string[];
  userAction: UserAction;
  formValues: FormValues;
}

export interface BrowserNavigateRequest {
  input: string;
  currentUrl: string;
  currentSummary: string;
}

export interface BrowserInteractRequest {
  currentUrl: string;
  currentSummary: string;
  currentHtml: string;
  recentInteractionSummaries: string[];
  userAction: UserAction;
  formValues: FormValues;
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
  pageTitle: string;
  url: string;
  html: string;
  summary: string;
}

export interface BrowserInteractResponse extends BrowserNavigateResponse {}

export interface FrontendApiError {
  name: 'FrontendApiError';
  message: string;
  status?: number;
  code?: string;
}
