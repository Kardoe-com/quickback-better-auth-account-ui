/**
 * Stripe utility functions and types
 */

export interface StripeConfig {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
}

export interface Plan {
    name: string;
    priceId: string;
    annualDiscountPriceId?: string;
    price: number;
    annualPrice?: number;
    interval: 'month' | 'year';
    features: string[];
    limits: {
        projects?: number;
        storage?: number;
        users?: number;
        [key: string]: any;
    };
    popular: boolean;
    freeTrial?: {
        days: number;
    };
}

export interface Subscription {
    id: string;
    plan: string;
    referenceId: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused';
    periodStart?: Date;
    periodEnd?: Date;
    trialStart?: Date;
    trialEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    seats?: number;
}

export interface Customer {
    id: string;
    email: string;
    name?: string;
    stripeCustomerId?: string;
    subscriptions: Subscription[];
}

/**
 * Check if Stripe is configured on the server side
 * Note: Server-side vars not available in Vite SPA
 */
export function isStripeConfiguredServer(): boolean {
    return false; // Server-side check not applicable in SPA
}

/**
 * Check if Stripe is configured on the client side
 * Uses import.meta.env for Vite compatibility
 */
export function isStripeConfiguredClient(): boolean {
    return !!(
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY !== 'placeholder-for-build'
    );
}

/**
 * Get formatted price for display
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(cents / 100);
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(status: string): string {
    switch (status.toLowerCase()) {
        case 'active':
            return 'Active';
        case 'trialing':
            return 'Trial';
        case 'canceled':
            return 'Canceled';
        case 'incomplete':
            return 'Incomplete';
        case 'incomplete_expired':
            return 'Expired';
        case 'past_due':
            return 'Past Due';
        case 'unpaid':
            return 'Unpaid';
        default:
            return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

/**
 * Get status color class for badges
 */
export function getSubscriptionStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'trialing':
            return 'bg-blue-100 text-blue-800';
        case 'canceled':
            return 'bg-red-100 text-red-800';
        case 'incomplete':
        case 'past_due':
            return 'bg-yellow-100 text-yellow-800';
        case 'incomplete_expired':
        case 'unpaid':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

/**
 * Check if subscription is active (including trial)
 */
export function isSubscriptionActive(subscription: Subscription): boolean {
    return ['active', 'trialing'].includes(subscription.status);
}

/**
 * Check if subscription is in trial
 */
export function isSubscriptionInTrial(subscription: Subscription): boolean {
    return subscription.status === 'trialing' ||
        (!!subscription.trialEnd && new Date(subscription.trialEnd) > new Date());
}

/**
 * Check if subscription is canceled but still active
 */
export function isSubscriptionCanceledButActive(subscription: Subscription): boolean {
    return subscription.status === 'active' && subscription.cancelAtPeriodEnd === true;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(subscription: Subscription): number {
    if (!subscription.trialEnd) return 0;
    
    const trialEnd = new Date(subscription.trialEnd);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
}

/**
 * Get days remaining until subscription ends
 */
export function getSubscriptionDaysRemaining(subscription: Subscription): number {
    if (!subscription.periodEnd) return 0;
    
    const periodEnd = new Date(subscription.periodEnd);
    const now = new Date();
    const diffTime = periodEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
}

/**
 * Calculate usage percentage against plan limits
 */
export function calculateUsagePercentage(current: number, limit: number): number {
    if (limit === 0) return 0;
    return Math.min(100, (current / limit) * 100);
}

/**
 * Get plans from app config
 * This ensures consistent plan configuration across the application
 */
export async function getPlansFromConfig(): Promise<Plan[]> {
    // Dynamic import to avoid circular dependency
    const { appConfig } = await import('@/config/app');
    return appConfig.stripe.plans;
}

/**
 * Get plan by name
 */
export function getPlanByName(planName: string, plans: Plan[]): Plan | undefined {
    return plans.find(plan => plan.name.toLowerCase() === planName.toLowerCase());
}

/**
 * Sort plans by price (ascending)
 */
export function sortPlansByPrice(plans: Plan[]): Plan[] {
    return [...plans].sort((a, b) => a.price - b.price);
}