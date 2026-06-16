import type { AppId } from './app';

export type WindowContentKind = 'builtin' | 'generatedHtml' | 'browserHtml' | 'empty';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowContentState {
  kind: WindowContentKind;
  payload?: unknown;
}

export interface WindowState extends WindowBounds {
  id: string;
  appId: AppId;
  title: string;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  loading: boolean;
  error: string | null;
  content: WindowContentState;
  restoreBounds?: WindowBounds;
}
