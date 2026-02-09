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
import authClient from "@/auth/authClient";
import { User } from "../types";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteUserDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserDeleted: () => void;
}

export function DeleteUserDialog({
    user,
    open,
    onOpenChange,
    onUserDeleted,
}: DeleteUserDialogProps) {
    const [confirmationText, setConfirmationText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const expectedText = user ? `delete ${user.email}` : "";
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
        if (!user || !isConfirmed) return;

        setIsLoading(true);
        setError("");

        try {
            const { error: deleteError } = await authClient.admin.removeUser({
                userId: user.id,
            });

            if (deleteError) {
                setError(deleteError.message || "Failed to delete user");
                return;
            }

            onUserDeleted();
            handleClose();
        } catch (err) {
            console.error("Error deleting user:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete User
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p className="font-semibold">This action cannot be undone!</p>
                        <p>
                            This will permanently delete <span className="font-medium">{user.name}</span>&apos;s account
                            and remove all their data from the system, including:
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            <li>User profile and settings</li>
                            <li>All active sessions</li>
                            <li>Organization memberships</li>
                            <li>Uploaded files</li>
                        </ul>
                        <p>To confirm deletion, please type exactly:</p>
                        <p className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded text-center select-all">
                            {expectedText}
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="delete-confirmation">Type confirmation text</Label>
                        <Input
                            id="delete-confirmation"
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
                            {isLoading ? "Deleting..." : "Delete User"}
                        </Button>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
