"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { subscriptionApi } from "@/lib/subscriptions";
import {
    Subscription,
    SUBSCRIPTION_TIERS,
    SUBSCRIPTION_STATUSES,
    SubscriptionTier,
    SubscriptionStatus,
} from "../types";
import { Pencil } from "lucide-react";

interface EditSubscriptionDialogProps {
    subscription: Subscription | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditSubscriptionDialog({
    subscription,
    open,
    onOpenChange,
    onSuccess,
}: EditSubscriptionDialogProps) {
    const [tier, setTier] = useState<SubscriptionTier>("free");
    const [status, setStatus] = useState<SubscriptionStatus>("active");
    const [expiresAt, setExpiresAt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (subscription) {
            setTier(subscription.tier);
            setStatus(subscription.status);
            setExpiresAt(subscription.expiresAt ? subscription.expiresAt.split("T")[0] : "");
        }
    }, [subscription]);

    const handleClose = () => {
        setError("");
        onOpenChange(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subscription) return;

        setIsLoading(true);
        setError("");

        try {
            await subscriptionApi.update(subscription.id, {
                tier,
                status,
                expiresAt: expiresAt || null,
            });

            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error("Error updating subscription:", err);
            setError(err?.error || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const getOrgInitials = (name: string | undefined) => {
        if (name) {
            return name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return "?";
    };

    if (!subscription) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5" />
                        Edit Subscription
                    </DialogTitle>
                    <DialogDescription>
                        Update subscription tier, status, or expiration date.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Organization Info (Read-only) */}
                        <div className="grid gap-2">
                            <Label>Organization</Label>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={subscription.organization?.logo || undefined} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {getOrgInitials(subscription.organization?.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{subscription.organization?.name || "Unknown Organization"}</p>
                                    <p className="text-sm text-muted-foreground">
                                        /{subscription.organization?.slug || subscription.organizationId}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stripe Info (Read-only if present) */}
                        {(subscription.stripeCustomerId || subscription.stripeSubscriptionId) && (
                            <div className="grid gap-2">
                                <Label>Stripe Info</Label>
                                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                                    {subscription.stripeCustomerId && (
                                        <p className="text-muted-foreground">
                                            Customer: <span className="font-mono">{subscription.stripeCustomerId}</span>
                                        </p>
                                    )}
                                    {subscription.stripeSubscriptionId && (
                                        <p className="text-muted-foreground">
                                            Subscription: <span className="font-mono">{subscription.stripeSubscriptionId}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tier Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="edit-tier">Tier</Label>
                            <Select value={tier} onValueChange={(v) => setTier(v as SubscriptionTier)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a tier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUBSCRIPTION_TIERS.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUBSCRIPTION_STATUSES.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Expiration Date */}
                        <div className="grid gap-2">
                            <Label htmlFor="edit-expiresAt">Expires At</Label>
                            <Input
                                id="edit-expiresAt"
                                type="date"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty for no expiration
                            </p>
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                {error}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
