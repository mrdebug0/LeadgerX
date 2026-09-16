/**
 * LeadgerX Unified API Client
 * Centralized HTTP service handling authentication headers, active store ID multi-tenancy,
 * timeout controls, and structured response error handling.
 */

const API_TIMEOUT = 15000; // 15 seconds timeout

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('leadgerx_token') || null;
  }

  private getStoreId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('leadgerx_active_store_id') || localStorage.getItem('leadgerx_active_store') || null;
  }

  private async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { timeout = API_TIMEOUT, headers = {}, ...customConfig } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const token = this.getToken();
    const storeId = this.getStoreId();

    const mergedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(storeId ? { 'x-store-id': storeId } : {}),
      ...(headers as Record<string, string>),
    };

    try {
      const response = await fetch(endpoint, {
        ...customConfig,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          // Token expired or invalid
          const isAuthPage = window.location.pathname.includes('/auth');
          if (!isAuthPage) {
            window.dispatchEvent(new CustomEvent('leadgerx:unauthorized'));
          }
        }
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data: any = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage = (data && data.error) || (data && data.message) || `Request failed with status ${response.status}`;
        throw new ApiError(errorMessage, response.status, data);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your internet connection.', 408);
      }
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err.message || 'Network connection failed', 0);
    }
  }

  public get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  public post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  public put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }

  public async upload<T = any>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const token = this.getToken();
    const storeId = this.getStoreId();

    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(storeId ? { 'x-store-id': storeId } : {}),
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.error || 'Upload failed', response.status, errorData);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
