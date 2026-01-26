import type { ApiErrorResponse, ErrorCodeType } from "./errors";

export class ClientApiError extends Error {
  constructor(
    public readonly code: ErrorCodeType,
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ClientApiError";
  }

  static fromResponse(response: ApiErrorResponse, statusCode: number): ClientApiError {
    return new ClientApiError(response.code, statusCode, response.error, response.details);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({
      error: response.statusText,
      code: "INTERNAL_ERROR" as ErrorCodeType,
    }))) as ApiErrorResponse;

    throw ClientApiError.fromResponse(errorData, response.status);
  }

  return response.json();
}

export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url);
    return handleResponse<T>(response);
  },

  post: async <T, D = unknown>(url: string, data?: D): Promise<T> => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  patch: async <T, D = unknown>(url: string, data?: D): Promise<T> => {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  put: async <T, D = unknown>(url: string, data?: D): Promise<T> => {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  delete: async <T = void, D = unknown>(url: string, data?: D): Promise<T> => {
    const response = await fetch(url, {
      method: "DELETE",
      headers: data ? { "Content-Type": "application/json" } : undefined,
      body: data ? JSON.stringify(data) : undefined,
    });
    if (response.status === 204) {
      return undefined as T;
    }
    return handleResponse<T>(response);
  },
};
