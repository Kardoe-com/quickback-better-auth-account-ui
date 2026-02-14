import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Check if an email belongs to an anonymous user.
 * Anonymous emails use the format: {uuid}@anon.{baseDomain}
 */
export function isAnonymousEmail(email?: string | null): boolean {
    if (!email) return false;
    return /@anon\./.test(email);
}
