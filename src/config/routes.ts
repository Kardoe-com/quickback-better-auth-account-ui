/**
 * Route Configuration
 * 
 * @deprecated Import from '@/config/app' instead
 * This file is kept for backward compatibility and re-exports from app.ts
 */

export type { AppConfig } from './app';
import { appConfig, isProtectedRoute, isAuthRoute, isAdminRoute } from './app';

/**
 * @deprecated Use appConfig.routes instead
 */
export const routes = appConfig.routes;

/**
 * @deprecated Use isProtectedRoute from '@/config/app' instead
 */
export { isProtectedRoute, isAuthRoute, isAdminRoute };
