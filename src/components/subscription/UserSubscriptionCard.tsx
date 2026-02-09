"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Calendar, Sparkles } from "lucide-react";
import { getOrganizationSubscription } from "@/lib/subscriptions";
import { Subscription, SubscriptionStatus, SubscriptionTier } from "@/app/(authenticated)/admin/types";

interface OrgSubscriptionCardProps {
    organizationId: string;
}

export function OrgSubscriptionCard({ organizationId }: OrgSubscriptionCardProps) {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Track if we've already fetched for this org to prevent duplicate fetches
    const fetchedOrgRef = useRef<string | null>(null);
    const isFetchingRef = useRef(false);

    useEffect(() => {
        async function fetchSubscription() {
            // Prevent duplicate fetches
            if (fetchedOrgRef.current === organizationId || isFetchingRef.current) {
                return;
            }

            isFetchingRef.current = true;
            setIsLoading(true);
            setError("");

            try {
                const sub = await getOrganizationSubscription(organizationId);
                setSubscription(sub);
                fetchedOrgRef.current = organizationId;
            } catch (err: any) {
                console.error("Error fetching subscription:", err);
                setError(err?.error || "Failed to load subscription");
            } finally {
                setIsLoading(false);
                isFetchingRef.current = false;
            }
        }

        if (organizationId && fetchedOrgRef.current !== organizationId) {
            fetchSubscription();
        }
    }, [organizationId]);

    const formatDate = (date: string | null | undefined) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getTierBadgeVariant = (tier: SubscriptionTier) => {
        switch (tier) {
            case "pro":
                return "default";
            default:
                return "secondary";
        }
    };

    const getStatusBadgeVariant = (status: SubscriptionStatus) => {
        switch (status) {
            case "active":
                return "outline" as const;
            case "trialing":
                return "secondary" as const;
            case "cancelled":
                return "destructive" as const;
            case "expired":
                return "destructive" as const;
            default:
                return "outline" as const;
        }
    };

    const getStatusBadgeClass = (status: SubscriptionStatus) => {
        switch (status) {
            case "active":
                return "text-green-600 border-green-600";
            case "trialing":
                return "";
            default:
                return "";
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-32" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        Subscription
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (!subscription) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        Subscription
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="mb-3 p-3 bg-muted rounded-full">
                            <Sparkles className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No active subscription</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Contact your administrator to get started
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Subscription
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Tier and Status */}
                    <div className="flex items-center gap-3">
                        <Badge variant={getTierBadgeVariant(subscription.tier)} className="text-sm px-3 py-1">
                            {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                        </Badge>
                        <Badge
                            variant={getStatusBadgeVariant(subscription.status)}
                            className={getStatusBadgeClass(subscription.status)}
                        >
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </Badge>
                    </div>

                    {/* Expiration Date */}
                    {subscription.expiresAt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {subscription.status === "expired" ? "Expired" : "Expires"} on{" "}
                                {formatDate(subscription.expiresAt)}
                            </span>
                        </div>
                    )}

                    {/* Start Date */}
                    {subscription.startsAt && (
                        <div className="text-sm text-muted-foreground">
                            Started {formatDate(subscription.startsAt)}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Keep backward compatibility export
export { OrgSubscriptionCard as UserSubscriptionCard };
