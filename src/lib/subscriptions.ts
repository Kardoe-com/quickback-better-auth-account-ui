/**
 * Subscription API Client
 *
 * API client for subscription CRUD operations via the data API
 */

import { getDataApiUrl } from "@/config/runtime";
import { Subscription, SubscriptionTier, SubscriptionStatus } from "@/app/(authenticated)/admin/types";

export interface SubscriptionListOptions {
    limit?: number;
    offset?: number;
    sort?: string;
    order?: "asc" | "desc";
    filters?: {
        organizationId?: string;
        tier?: SubscriptionTier;
        status?: SubscriptionStatus;
        search?: string;
    };
}

export interface CreateSubscriptionData {
    organizationId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    expiresAt?: string | null;
}

export interface UpdateSubscriptionData {
    tier?: SubscriptionTier;
    status?: SubscriptionStatus;
    expiresAt?: string | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        limit: number;
        offset: number;
        count: number;
    };
}

/**
 * Make an authenticated fetch request to the API
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
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
        throw error;
    }

    return res.json();
}

/**
 * Build query string from options
 */
function buildQueryString(options?: SubscriptionListOptions): string {
    if (!options) return "";

    const params = new URLSearchParams();

    if (options.limit) params.set("limit", String(options.limit));
    if (options.offset) params.set("offset", String(options.offset));
    if (options.sort) params.set("sort", options.sort);
    if (options.order) params.set("order", options.order);

    if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
            if (value !== undefined && value !== null) {
                params.set(key, String(value));
            }
        }
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
}

/**
 * Subscription API client
 */
export const subscriptionApi = {
    /**
     * List all subscriptions (admin)
     */
    list: (options?: SubscriptionListOptions) =>
        apiFetch<PaginatedResponse<Subscription>>(`/subscriptions${buildQueryString(options)}`),

    /**
     * Get a single subscription by ID
     */
    get: (id: string) =>
        apiFetch<Subscription>(`/subscriptions/${id}`),

    /**
     * Create a new subscription
     */
    create: (data: CreateSubscriptionData) =>
        apiFetch<Subscription>(`/subscriptions`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    /**
     * Update an existing subscription
     */
    update: (id: string, data: UpdateSubscriptionData) =>
        apiFetch<Subscription>(`/subscriptions/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    /**
     * Delete a subscription
     */
    delete: (id: string) =>
        apiFetch<void>(`/subscriptions/${id}`, { method: "DELETE" }),
};

/**
 * List all organizations (admin only)
 */
export async function listOrganizations(): Promise<{ id: string; name: string; slug: string; logo?: string | null }[]> {
    const response = await apiFetch<{ data: any[] }>(`/organizations`);
    return response.data || [];
}

// Track fetch attempts to prevent runaway retries
const fetchAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 3;
const COOLDOWN_MS = 30000; // 30 seconds cooldown after max attempts

/**
 * Get subscription for an organization
 */
export async function getOrganizationSubscription(organizationId: string): Promise<Subscription | null> {
    // Check retry limits
    const key = `subscription-${organizationId}`;
    const attempts = fetchAttempts.get(key);
    const now = Date.now();

    if (attempts) {
        // Reset if cooldown has passed
        if (now - attempts.lastAttempt > COOLDOWN_MS) {
            fetchAttempts.delete(key);
        } else if (attempts.count >= MAX_ATTEMPTS) {
            console.warn(`[subscriptions] Max attempts (${MAX_ATTEMPTS}) reached for org ${organizationId}, skipping fetch`);
            return null;
        }
    }

    try {
        const response = await subscriptionApi.list({
            filters: { organizationId },
            limit: 1,
        });
        // Clear attempts on success
        fetchAttempts.delete(key);
        return response.data[0] || null;
    } catch (error) {
        // Track failed attempt
        const current = fetchAttempts.get(key) || { count: 0, lastAttempt: 0 };
        fetchAttempts.set(key, { count: current.count + 1, lastAttempt: now });

        console.error(`Error fetching organization subscription (attempt ${current.count + 1}/${MAX_ATTEMPTS}):`, error);
        return null;
    }
}

export default subscriptionApi;
