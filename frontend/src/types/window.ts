import type { AppId } from './app';

export type WindowContentKind = 'builtin' | 'generatedHtml' | 'browserHtml' | 'empty';

export type WindowResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

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
  loadingText: string | null;
  loadingTextKey: number;
  error: string | null;
  retryToken: number;
  requestSequence: number;
  activeRequestId: number | null;
  content: WindowContentState;
  restoreBounds?: WindowBounds;
}
