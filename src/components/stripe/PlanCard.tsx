"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/stripe";
import { appConfig } from "@/config/app";

type Plan = typeof appConfig.stripe.plans[0];

interface PlanCardProps {
    plan: Plan;
    currentPlan?: string;
    isSubscribed?: boolean;
    onSelectPlan: (planName: string) => void;
    loading?: boolean;
    annual?: boolean;
}

export function PlanCard({
    plan,
    currentPlan,
    isSubscribed = false,
    onSelectPlan,
    loading = false,
    annual = false
}: PlanCardProps) {
    const isCurrentPlan = currentPlan === plan.name;
    const price = annual && plan.annualPrice ? plan.annualPrice : plan.price;
    const interval = annual ? 'year' : plan.interval;
    
    const getButtonText = () => {
        if (isCurrentPlan && isSubscribed) {
            return "Current Plan";
        }
        if (isSubscribed) {
            return "Switch Plan";
        }
        if (plan.freeTrial && !annual) {
            return `Start ${plan.freeTrial.days}-day Trial`;
        }
        return "Get Started";
    };

    const getSavingsText = () => {
        if (!annual || !plan.annualPrice) return null;
        
        const monthlyTotal = plan.price * 12;
        const savings = monthlyTotal - plan.annualPrice;
        const savingsPercent = Math.round((savings / monthlyTotal) * 100);
        
        return `Save ${savingsPercent}% annually`;
    };

    return (
        <Card 
            className={`relative transition-all hover:shadow-md ${
                plan.popular ? 'border-blue-200 shadow-md' : ''
            } ${
                isCurrentPlan ? 'border-green-200 bg-green-50/50' : ''
            }`}
        >
            {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Most Popular
                </Badge>
            )}
            {isCurrentPlan && (
                <Badge className="absolute -top-2 right-4 bg-green-600">
                    Current
                </Badge>
            )}

            <CardHeader className="text-center pb-4">
                <CardTitle className="capitalize text-xl">{plan.name}</CardTitle>
                
                <div className="space-y-1">
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">{formatPrice(price)}</span>
                        <span className="text-muted-foreground">/{interval}</span>
                    </div>
                    
                    {annual && plan.annualPrice && (
                        <div className="text-sm">
                            <span className="text-muted-foreground line-through">
                                {formatPrice(plan.price * 12)}/year
                            </span>
                            <span className="ml-2 text-green-600 font-medium">
                                {getSavingsText()}
                            </span>
                        </div>
                    )}
                    
                    {plan.freeTrial && !annual && (
                        <div className="text-sm text-blue-600 font-medium">
                            {plan.freeTrial.days} days free
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>

                {/* Plan Limits */}
                {Object.keys(plan.limits).length > 0 && (
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Limits</h4>
                        <div className="space-y-1">
                            {plan.limits.projects && (
                                <div className="flex justify-between text-xs">
                                    <span>Projects</span>
                                    <span>{plan.limits.projects}</span>
                                </div>
                            )}
                            {plan.limits.storage && (
                                <div className="flex justify-between text-xs">
                                    <span>Storage</span>
                                    <span>{plan.limits.storage}GB</span>
                                </div>
                            )}
                            {plan.limits.users && (
                                <div className="flex justify-between text-xs">
                                    <span>Team members</span>
                                    <span>{plan.limits.users}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Button
                    className="w-full"
                    onClick={() => onSelectPlan(plan.name)}
                    disabled={loading || (isCurrentPlan && isSubscribed)}
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                >
                    {loading ? "Loading..." : getButtonText()}
                </Button>
            </CardContent>
        </Card>
    );
}