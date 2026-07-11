const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface ApiError {
  message: string;
  type: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Custom error class representing API failures.
 */
export class ApiRequestError extends Error {
  type: string;
  status: number;
  details?: any;

  constructor(message: string, type: string, status: number, details?: any) {
    super(message);
    this.name = "ApiRequestError";
    this.type = type;
    this.status = status;
    this.details = details;
  }
}

/**
 * Standard fetch helper.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  // Make sure headers are initialized
  const headers = new Headers(options.headers || {});
  
  // Set content type to JSON unless it's FormData (FormData sets its own multipart boundaries)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let responseData: any;
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    responseData = await response.json();
  } else {
    // Return raw text if not JSON (e.g. PDF blobs or binary data)
    responseData = await response.text();
  }

  if (!response.ok) {
    // If it's our standard custom backend exception payload, parse it
    if (responseData && responseData.error) {
      throw new ApiRequestError(
        responseData.error.message || "An error occurred",
        responseData.error.type || "APIError",
        response.status,
        responseData.error.details
      );
    } else {
      throw new ApiRequestError(
        typeof responseData === "string" ? responseData : "HTTP Request failed",
        "HTTPError",
        response.status
      );
    }
  }

  return responseData as T;
}

/**
 * Exported API service client wrapper
 */
export const api = {
  get: <T>(endpoint: string, headers?: HeadersInit) =>
    request<T>(endpoint, { method: "GET", headers }),

  post: <T>(endpoint: string, body: any, headers?: HeadersInit) => {
    let requestBody: any;
    
    if (body instanceof FormData) {
      requestBody = body;
    } else {
      requestBody = JSON.stringify(body);
    }

    return request<T>(endpoint, {
      method: "POST",
      body: requestBody,
      headers,
    });
  },

  delete: <T>(endpoint: string, headers?: HeadersInit) =>
    request<T>(endpoint, { method: "DELETE", headers }),

  /**
   * Helper to check backend server connectivity.
   */
  async checkHealth(): Promise<{ status: string; services: any }> {
    try {
      const response = await this.get<{ status: string; database: string; services: any }>("/health");
      return {
        status: response.status === "healthy" ? "connected" : "unhealthy",
        services: response.services,
      };
    } catch (err) {
      return {
        status: "disconnected",
        services: { whisper: "unavailable", openai: "unavailable" },
      };
    }
  }
};
