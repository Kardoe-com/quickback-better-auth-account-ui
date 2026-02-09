/**
 * Feature Flags Configuration
 * 
 * @deprecated Import from '@/config/app' instead
 * This file is kept for backward compatibility and re-exports from app.ts
 */

export type { AppConfig } from './app';
import { appConfig, isFeatureEnabled } from './app';

/**
 * @deprecated Use appConfig.features instead
 */
export const features = appConfig.features;

/**
 * @deprecated Use isFeatureEnabled from '@/config/app' instead
 */
export { isFeatureEnabled };

/**
 * Get all enabled features as an array
 */
export function getEnabledFeatures(): (keyof typeof features)[] {
  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as keyof typeof features);
}
