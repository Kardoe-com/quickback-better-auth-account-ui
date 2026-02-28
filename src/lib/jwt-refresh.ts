/**
 * JWT Token Refresh
 *
 * Refreshes the JWT auth token by calling the token endpoint.
 * Called after org switch or other auth context changes.
 */

import { getDataApiUrl } from "@/config/runtime";

/**
 * Refresh the stored JWT by requesting a fresh token from the API.
 * Requires an active session (cookie-based auth).
 */
export async function refreshAuthToken(): Promise<void> {
    try {
        const res = await fetch(getDataApiUrl("/token"), {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
            const { token } = await res.json();
            if (token) {
                localStorage.setItem("bearer_token", token);
            }
        }
    } catch {
        // Non-fatal: will fall back to session auth on next request
    }
}
