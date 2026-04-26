import {
    organizationClient,
    adminClient,
    emailOTPClient,
    jwtClient,
} from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";
import { appConfig } from "@/config/app";
import { getApiBase } from "@/config/runtime";

function _createClient() {
    return createAuthClient({
        baseURL: getApiBase(),
        basePath: appConfig.routes.api.auth,
        plugins: [
            organizationClient(),
            apiKeyClient(),
            adminClient(),
            emailOTPClient(),
            jwtClient(),
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

// `tsc -p tsconfig.build.json` emits a .d.ts for this file. The full inferred
// return type of `createAuthClient(...)` with six plugins resolves through
// pnpm's nested `.pnpm/zod@4.3.6/.../core` paths, which trips both TS7056
// ("inferred type too long to serialize") and TS2742 ("non-portable type").
// Widening the export to `any` keeps the runtime intact (consumers still call
// `client.signIn.email`, `client.organization.acceptInvitation`, etc.) and
// unblocks the declaration emit. Pulling in better-auth's published client
// type explicitly is the long-term fix; doing it here would re-introduce the
// same plugin-graph blowup the .d.ts emit can't serialize.
const client: any = _createClient();

export default client;
