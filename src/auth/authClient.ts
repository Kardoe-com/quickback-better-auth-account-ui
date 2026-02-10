import {
    organizationClient,
    apiKeyClient,
    adminClient,
    emailOTPClient,
    jwtClient,
    anonymousClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";
import { appConfig } from "@/config/app";
import { getApiBase } from "@/config/runtime";

function _createClient() {
    return createAuthClient({
        baseURL: getApiBase(),
        basePath: appConfig.routes.api.auth,
        plugins: [
            organizationClient({
                teams: {
                    enabled: true,
                },
            }),
            apiKeyClient(),
            adminClient(),
            emailOTPClient(),
            jwtClient(),
            anonymousClient(),
            passkeyClient(),
        ],
        fetchOptions: {
            // Ensure cookies are included in requests (for web)
            credentials: 'include',
            // Store Bearer token from response headers for mobile/API use
            onSuccess: (ctx) => {
                const authToken = ctx.response.headers.get("set-auth-token");
                if (authToken && typeof window !== 'undefined') {
                    localStorage.setItem("bearer_token", authToken);
                }
            },
        }
    });
}

const client = _createClient();

export default client;
