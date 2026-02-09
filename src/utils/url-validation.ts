import { appConfig } from "@/config/app";

/**
 * Validates if a URL is safe for redirect
 * Only allows internal URLs or explicitly whitelisted external URLs
 */
export function isValidCallbackUrl(url: string | null): boolean {
  if (!url) return false;
  
  try {
    // Parse the URL
    const parsedUrl = new URL(url, window.location.origin);
    
    // Check if it's a relative URL (same origin)
    if (parsedUrl.origin === window.location.origin) {
      return true;
    }
    
    // Check against whitelist of allowed external URLs
    const allowedOrigins = [
      appConfig.urls.base,
      // Add any other trusted domains here
    ].filter(Boolean);
    
    return allowedOrigins.includes(parsedUrl.origin);
  } catch {
    // If URL parsing fails, it's not a valid URL
    return false;
  }
}

/**
 * Sanitizes a callback URL, returning a safe default if invalid
 */
export function sanitizeCallbackUrl(url: string | null, defaultUrl: string): string {
  return isValidCallbackUrl(url) ? url! : defaultUrl;
}