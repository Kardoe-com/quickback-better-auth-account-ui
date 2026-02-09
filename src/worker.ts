/**
 * Cloudflare Worker entry point for Auth UI SPA
 *
 * Serves static assets and handles SPA routing.
 * Apps using @quickback/auth-ui can import this worker directly:
 *
 * ```ts
 * // src/worker.ts
 * export { default } from '@quickback/auth-ui/worker';
 * ```
 *
 * Or re-export with custom logic:
 *
 * ```ts
 * import { createAuthWorker } from '@quickback/auth-ui/worker';
 * export default createAuthWorker();
 * ```
 */

export interface Env {
  ASSETS: { fetch: typeof fetch };
}

/**
 * Default worker handler for SPA routing
 */
const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        app: 'auth-ui',
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to serve static asset first
    const assetResponse = await env.ASSETS.fetch(request);

    // If asset found (not 404), return it
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // For SPA routing: serve index.html for all non-asset routes
    // This allows React Router to handle client-side routing
    const indexRequest = new Request(`${url.origin}/index.html`, request);
    return env.ASSETS.fetch(indexRequest);
  },
};

export default worker;

/**
 * Factory function for creating a worker with custom options
 */
export function createAuthWorker() {
  return worker;
}
