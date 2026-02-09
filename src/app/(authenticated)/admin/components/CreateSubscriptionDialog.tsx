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
    SUBSCRIPTION_TIERS,
    SUBSCRIPTION_STATUSES,
    SubscriptionTier,
    SubscriptionStatus,
} from "../types";
import { Plus, Building2 } from "lucide-react";
import { listOrganizations } from "@/lib/subscriptions";

interface Organization {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
}

interface CreateSubscriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateSubscriptionDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateSubscriptionDialogProps) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [tier, setTier] = useState<SubscriptionTier>("free");
    const [status, setStatus] = useState<SubscriptionStatus>("active");
    const [expiresAt, setExpiresAt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
    const [error, setError] = useState("");

    // Load organizations when dialog opens
    useEffect(() => {
        if (open) {
            loadOrganizations();
        }
    }, [open]);

    const loadOrganizations = async () => {
        setIsLoadingOrgs(true);
        try {
            // Use the auth API to list all organizations
            const orgs = await listOrganizations();
            setOrganizations(orgs);
        } catch (err: any) {
            console.error("Error loading organizations:", err);
            setError("Failed to load organizations");
        } finally {
            setIsLoadingOrgs(false);
        }
    };

    const resetForm = () => {
        setSelectedOrgId("");
        setSelectedOrg(null);
        setTier("free");
        setStatus("active");
        setExpiresAt("");
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleOrgSelect = (orgId: string) => {
        setSelectedOrgId(orgId);
        const org = organizations.find(o => o.id === orgId);
        setSelectedOrg(org || null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedOrgId) {
            setError("Please select an organization");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await subscriptionApi.create({
                organizationId: selectedOrgId,
                tier,
                status,
                expiresAt: expiresAt || null,
            });

            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error("Error creating subscription:", err);
            setError(err?.error || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const getOrgInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create Subscription
                    </DialogTitle>
                    <DialogDescription>
                        Create a new subscription for an organization.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Organization Select */}
                        <div className="grid gap-2">
                            <Label htmlFor="organization">Organization</Label>
                            <Select
                                value={selectedOrgId}
                                onValueChange={handleOrgSelect}
                                disabled={isLoadingOrgs}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingOrgs ? "Loading..." : "Select an organization"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map((org) => (
                                        <SelectItem key={org.id} value={org.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{org.name}</span>
                                                <span className="text-muted-foreground">/{org.slug}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selected Organization Display */}
                        {selectedOrg && (
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedOrg.logo || undefined} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {getOrgInitials(selectedOrg.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{selectedOrg.name}</p>
                                    <p className="text-xs text-muted-foreground">/{selectedOrg.slug}</p>
                                </div>
                            </div>
                        )}

                        {/* Tier Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="tier">Tier</Label>
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
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUBSCRIPTION_STATUSES.filter(s => s.value === "active" || s.value === "trialing").map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Expiration Date */}
                        <div className="grid gap-2">
                            <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                            <Input
                                id="expiresAt"
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
                        <Button type="submit" disabled={isLoading || !selectedOrgId}>
                            {isLoading ? "Creating..." : "Create Subscription"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
