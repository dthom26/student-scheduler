import { API_BASE_URL } from "../constants/api";

export interface HttpOptions extends RequestInit {
  authToken?: string;
}

export async function http<T>(
  endpoint: string,
  options: HttpOptions = {}
): Promise<T> {
  const { authToken, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || response.statusText);
  }

  if (response.status === 204) {
    // No Content
    return null as T;
  }
  return response.json();
}
