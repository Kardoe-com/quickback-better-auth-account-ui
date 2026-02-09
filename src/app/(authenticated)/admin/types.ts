// Admin types based on Better Auth Admin plugin

export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    role?: string | null;
    banned?: boolean | null;
    banReason?: string | null;
    banExpires?: Date | null;
}

export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    timezone?: string | null;
    city?: string | null;
    country?: string | null;
    region?: string | null;
    regionCode?: string | null;
    impersonatedBy?: string | null;
}

export interface ListUsersResponse {
    users: User[];
    total: number;
    limit?: number;
    offset?: number;
}

export interface ListUsersParams {
    searchValue?: string;
    searchField?: "email" | "name";
    searchOperator?: "contains" | "starts_with" | "ends_with";
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    filterField?: string;
    filterValue?: string | number | boolean;
    filterOperator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
}

export type UserRole = "user" | "admin";

export const USER_ROLES: { value: UserRole; label: string }[] = [
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
];

// Subscription types
export interface Subscription {
    id: string;
    organizationId: string;
    tier: "free" | "pro";
    status: "active" | "cancelled" | "expired" | "trialing";
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    createdAt: string;
    modifiedAt: string;
    organization?: { id: string; name: string; slug: string; logo?: string | null };
}

export type SubscriptionTier = "free" | "pro";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trialing";

export const SUBSCRIPTION_TIERS: { value: SubscriptionTier; label: string }[] = [
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro" },
];

export const SUBSCRIPTION_STATUSES: { value: SubscriptionStatus; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "trialing", label: "Trialing" },
    { value: "cancelled", label: "Cancelled" },
    { value: "expired", label: "Expired" },
];
