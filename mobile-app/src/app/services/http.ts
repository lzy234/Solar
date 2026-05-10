export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string | null;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const DEFAULT_API_BASE_URL = "https://solar-system-mon.preview.aliyun-zeabur.cn";
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const baseUrl = normalizeBaseUrl(
    configuredBaseUrl === undefined ? DEFAULT_API_BASE_URL : configuredBaseUrl,
  );

  if (!baseUrl) {
    return normalizedPath;
  }

  return `${baseUrl}${normalizedPath}`;
}

async function parseJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new ApiError("接口返回了无法解析的 JSON", response.status, {
      cause: error,
      responseText: text,
    });
  }
}

export async function requestJson<T>(path: string, options: ApiRequestOptions = {}) {
  const { body, headers, signal, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, ...restOptions } = options;
  const requestHeaders = new Headers(headers);
  const requestController = new AbortController();
  let didTimeout = false;

  const abortRequest = () => {
    requestController.abort();
  };

  if (signal) {
    if (signal.aborted) {
      requestController.abort();
    } else {
      signal.addEventListener("abort", abortRequest, { once: true });
    }
  }

  const timeoutId =
    timeoutMs > 0
      ? window.setTimeout(() => {
          didTimeout = true;
          requestController.abort();
        }, timeoutMs)
      : null;

  requestHeaders.set("Accept", "application/json");

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(buildUrl(path), {
      ...restOptions,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: requestController.signal,
    });

    const payload = await parseJson(response);

    if (!response.ok) {
      throw new ApiError(`请求失败，状态码 ${response.status}`, response.status, payload);
    }

    if (!payload || typeof payload !== "object") {
      throw new ApiError("接口返回格式不正确", response.status, payload);
    }

    const envelope = payload as ApiEnvelope<T>;

    if (!envelope.success) {
      throw new ApiError(envelope.message || "接口返回 success=false", response.status, payload);
    }

    return envelope.data;
  } catch (error) {
    if (didTimeout) {
      throw new ApiError("请求超时，请稍后重试", 408, error);
    }

    throw error;
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    signal?.removeEventListener("abort", abortRequest);
  }
}
