/**
 * Quickback API Client
 *
 * A typed client for CRUD operations with your Quickback API
 * See https://docs.quickback.dev for full API documentation
 */

import { getDataApiUrl } from "@/config/runtime";

export interface ListOptions {
    limit?: number;
    offset?: number;
    sort?: string;
    order?: "asc" | "desc";
    filters?: Record<string, string | number | boolean>;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        limit: number;
        offset: number;
        count: number;
    };
}

export interface APIError {
    error: string;
    layer?: "firewall" | "access" | "guards" | "validation";
    errors?: Array<{ field: string; message: string }>;
}

/**
 * Make an authenticated fetch request to the Quickback API
 */
export async function apiFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const url = getDataApiUrl(path);

    const res = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw error as APIError;
    }

    return res.json();
}

/**
 * Build query string from ListOptions
 */
function buildQueryString(options?: ListOptions): string {
    if (!options) return "";

    const params = new URLSearchParams();

    if (options.limit) params.set("limit", String(options.limit));
    if (options.offset) params.set("offset", String(options.offset));
    if (options.sort) params.set("sort", options.sort);
    if (options.order) params.set("order", options.order);

    if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
            params.set(key, String(value));
        }
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
}

/**
 * Quickback API client for CRUD operations
 */
export const quickback = {
    /**
     * List resources with pagination and filtering
     * @example quickback.list<User>("users", { limit: 10, sort: "createdAt" })
     */
    list: <T>(resource: string, options?: ListOptions) =>
        apiFetch<PaginatedResponse<T>>(`/${resource}${buildQueryString(options)}`),

    /**
     * Get a single resource by ID
     * @example quickback.get<User>("users", "user_123")
     */
    get: <T>(resource: string, id: string) =>
        apiFetch<T>(`/${resource}/${id}`),

    /**
     * Create a new resource
     * @example quickback.create<User>("users", { name: "John", email: "john@example.com" })
     */
    create: <T>(resource: string, data: Partial<T>) =>
        apiFetch<T>(`/${resource}`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    /**
     * Update an existing resource
     * @example quickback.update<User>("users", "user_123", { name: "Jane" })
     */
    update: <T>(resource: string, id: string, data: Partial<T>) =>
        apiFetch<T>(`/${resource}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    /**
     * Delete a resource (soft delete)
     * @example quickback.delete("users", "user_123")
     */
    delete: (resource: string, id: string) =>
        apiFetch<void>(`/${resource}/${id}`, { method: "DELETE" }),

    /**
     * Execute a custom action on a resource
     * @example quickback.action<Invoice>("invoices", "inv_123", "approve", { notes: "Approved" })
     */
    action: <T>(resource: string, id: string, action: string, data?: unknown) =>
        apiFetch<T>(`/${resource}/${id}/${action}`, {
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        }),
};

export default quickback;
