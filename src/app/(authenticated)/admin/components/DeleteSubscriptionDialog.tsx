"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { subscriptionApi } from "@/lib/subscriptions";
import { Subscription } from "../types";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteSubscriptionDialogProps {
    subscription: Subscription | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DeleteSubscriptionDialog({
    subscription,
    open,
    onOpenChange,
    onSuccess,
}: DeleteSubscriptionDialogProps) {
    const [confirmationText, setConfirmationText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const expectedText = "delete subscription";
    const isConfirmed = confirmationText === expectedText;

    const resetForm = () => {
        setConfirmationText("");
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleDelete = async () => {
        if (!subscription || !isConfirmed) return;

        setIsLoading(true);
        setError("");

        try {
            await subscriptionApi.delete(subscription.id);
            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error("Error deleting subscription:", err);
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
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Subscription
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p className="font-semibold">This action cannot be undone!</p>
                        <p>
                            You are about to delete the subscription for:
                        </p>
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
                        <p>
                            This will remove their <span className="font-medium">{subscription.tier}</span> subscription
                            and revoke any associated benefits.
                        </p>
                        <p>To confirm deletion, please type exactly:</p>
                        <p className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded text-center select-all">
                            {expectedText}
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="delete-subscription-confirmation">Type confirmation text</Label>
                        <Input
                            id="delete-subscription-confirmation"
                            type="text"
                            placeholder={expectedText}
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            className={
                                confirmationText && !isConfirmed ? "border-red-500" : ""
                            }
                        />
                        {confirmationText && !isConfirmed && (
                            <p className="text-sm text-red-500">Text doesn&apos;t match</p>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={!isConfirmed || isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isLoading ? "Deleting..." : "Delete Subscription"}
                        </Button>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
