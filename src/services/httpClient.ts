import { API_BASE_URL } from "../constants/api";

export interface HttpOptions extends RequestInit {
  authToken?: string;
}

const REQUEST_TIMEOUT_MS = 20_000;

export async function http<T>(
  endpoint: string,
  options: HttpOptions = {}
): Promise<T> {
  const { authToken, headers, ...rest } = options;
  const base = API_BASE_URL ?? "";
  const fullUrl = `${base}${endpoint}`;
  // Helpful debug info when running in production — logs the full request URL
  // so missing/incorrect `VITE_API_BASE_URL` can be diagnosed quickly.
  // eslint-disable-next-line no-console
  console.debug("http request", options.method || "GET", fullUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s (url: ${fullUrl})`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => null);
    let message = response.statusText;
    // Try to parse JSON error message if present
    try {
      const json = errorText ? JSON.parse(errorText) : null;
      if (json && json.message) message = json.message;
    } catch {
      // not JSON
    }
    const err = new Error(`${response.status} ${message} (url: ${fullUrl})`);
    throw err;
  }

  if (response.status === 204) {
    // No Content
    return null as T;
  }
  return response.json();
}
