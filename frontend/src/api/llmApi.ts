import type {
  AppGenerateRequest,
  AppGenerateResponse,
  AppInteractRequest,
  AppInteractResponse,
  AppSearchRequest,
  AppSearchResponse,
  BrowserInteractRequest,
  BrowserInteractResponse,
  BrowserNavigateRequest,
  BrowserNavigateResponse,
  FrontendApiError,
} from '@/types/llm';

const API_BASE_PATH = '/api';

export class LlmApiError extends Error implements FrontendApiError {
  name = 'FrontendApiError' as const;

  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function readErrorResponse(response: Response) {
  const fallbackMessage = `请求失败，状态码 ${response.status}`;

  try {
    const payload = (await response.json()) as Partial<FrontendApiError> & {
      detail?: string | Partial<FrontendApiError>;
    };
    const detail = payload.detail;
    const detailMessage = typeof detail === 'object' ? detail.message : detail;
    const detailCode = typeof detail === 'object' ? detail.code : undefined;

    return {
      code: payload.code ?? detailCode,
      message: payload.message ?? detailMessage ?? fallbackMessage,
    };
  } catch {
    return {
      code: undefined,
      message: fallbackMessage,
    };
  }
}

async function postJson<TRequest, TResponse>(
  endpoint: string,
  body: TRequest,
  signal?: AbortSignal,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_PATH}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const error = await readErrorResponse(response);
    throw new LlmApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as TResponse;
}

export function appSearch(request: AppSearchRequest, signal?: AbortSignal) {
  return postJson<AppSearchRequest, AppSearchResponse>('/app-search', request, signal);
}

export function appGenerate(request: AppGenerateRequest, signal?: AbortSignal) {
  return postJson<AppGenerateRequest, AppGenerateResponse>('/app-generate', request, signal);
}

export function appInteract(request: AppInteractRequest, signal?: AbortSignal) {
  return postJson<AppInteractRequest, AppInteractResponse>('/app-interact', request, signal);
}

export function browserNavigate(request: BrowserNavigateRequest, signal?: AbortSignal) {
  return postJson<BrowserNavigateRequest, BrowserNavigateResponse>('/browser-navigate', request, signal);
}

export function browserInteract(request: BrowserInteractRequest, signal?: AbortSignal) {
  return postJson<BrowserInteractRequest, BrowserInteractResponse>('/browser-interact', request, signal);
}
