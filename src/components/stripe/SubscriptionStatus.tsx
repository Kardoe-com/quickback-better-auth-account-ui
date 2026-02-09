"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Crown, 
    Calendar, 
    Clock, 
    AlertCircle, 
    Settings,
    CreditCard,
    TrendingUp
} from "lucide-react";
import { 
    Subscription,
    formatPrice,
    getSubscriptionStatusColor,
    isSubscriptionInTrial,
    isSubscriptionCanceledButActive,
    getTrialDaysRemaining,
    getSubscriptionDaysRemaining
} from "@/lib/stripe";
import { appConfig } from "@/config/app";

type Plan = typeof appConfig.stripe.plans[0];

interface SubscriptionStatusProps {
    subscription: Subscription | null;
    plan?: Plan;
    onManageBilling?: () => void;
    onUpgrade?: () => void;
    loading?: boolean;
}

export function SubscriptionStatus({
    subscription,
    plan,
    onManageBilling,
    onUpgrade,
    loading = false
}: SubscriptionStatusProps) {
    if (!subscription) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Active Subscription</CardTitle>
                    <CardDescription>
                        Choose a plan to get started with premium features
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Start Your Subscription</h3>
                        <p className="text-muted-foreground mb-4 text-sm">
                            Get access to premium features and advanced capabilities
                        </p>
                        {onUpgrade && (
                            <Button onClick={onUpgrade}>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                View Plans
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isInTrial = isSubscriptionInTrial(subscription);
    const isCanceledButActive = isSubscriptionCanceledButActive(subscription);
    const trialDaysRemaining = getTrialDaysRemaining(subscription);
    const daysRemaining = getSubscriptionDaysRemaining(subscription);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-yellow-500" />
                            Current Subscription
                        </CardTitle>
                        <CardDescription>Your active subscription details</CardDescription>
                    </div>
                    <Badge className={getSubscriptionStatusColor(subscription.status)}>
                        {subscription.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Plan Info */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg capitalize">
                            {subscription.plan} Plan
                        </h3>
                        {plan && (
                            <p className="text-sm text-muted-foreground">
                                {formatPrice(plan.price)}/{plan.interval}
                                {subscription.seats && subscription.seats > 1 && (
                                    <span> × {subscription.seats} seats</span>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                {/* Billing Period */}
                {subscription.periodStart && subscription.periodEnd && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                            Billing period: {new Date(subscription.periodStart).toLocaleDateString()} - {new Date(subscription.periodEnd).toLocaleDateString()}
                        </span>
                    </div>
                )}

                {/* Trial Status */}
                {isInTrial && subscription.trialEnd && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div className="text-sm">
                            <span className="font-medium text-blue-900">
                                {trialDaysRemaining > 0 
                                    ? `${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left in trial`
                                    : 'Trial ended'
                                }
                            </span>
                            <div className="text-blue-700">
                                Trial ends {new Date(subscription.trialEnd).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancellation Notice */}
                {isCanceledButActive && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <div className="text-sm">
                            <span className="font-medium text-red-900">
                                Subscription will be canceled
                            </span>
                            <div className="text-red-700">
                                Access continues until {subscription.periodEnd 
                                    ? new Date(subscription.periodEnd).toLocaleDateString() 
                                    : 'the end of the billing period'
                                }
                                {daysRemaining > 0 && (
                                    <span> ({daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining)</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Plan Limits */}
                {plan && Object.keys(plan.limits).length > 0 && (
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">Plan Limits</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plan.limits.projects && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold">0</div>
                                    <div className="text-sm text-muted-foreground">
                                        of {plan.limits.projects} projects
                                    </div>
                                </div>
                            )}
                            {plan.limits.storage && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold">0GB</div>
                                    <div className="text-sm text-muted-foreground">
                                        of {plan.limits.storage}GB storage
                                    </div>
                                </div>
                            )}
                            {plan.limits.users && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold">1</div>
                                    <div className="text-sm text-muted-foreground">
                                        of {plan.limits.users} team members
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    {onManageBilling && (
                        <Button onClick={onManageBilling} disabled={loading}>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Billing
                        </Button>
                    )}
                    {onUpgrade && (
                        <Button onClick={onUpgrade} variant="outline" disabled={loading}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Change Plan
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}