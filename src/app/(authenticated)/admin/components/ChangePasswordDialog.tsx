"use client";

import { useState } from "react";
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
import authClient from "@/auth/authClient";
import { User } from "../types";
import { Key } from "lucide-react";

interface ChangePasswordDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPasswordChanged: () => void;
}

export function ChangePasswordDialog({
    user,
    open,
    onOpenChange,
    onPasswordChanged,
}: ChangePasswordDialogProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const resetForm = () => {
        setNewPassword("");
        setConfirmPassword("");
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const { error: passwordError } = await authClient.admin.setUserPassword({
                userId: user.id,
                newPassword,
            });

            if (passwordError) {
                setError(passwordError.message || "Failed to change password");
                return;
            }

            onPasswordChanged();
            handleClose();
        } catch (err) {
            console.error("Error changing password:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Change Password
                    </DialogTitle>
                    <DialogDescription>
                        Set a new password for <span className="font-medium">{user.name}</span> ({user.email}).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                minLength={8}
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
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
                            {isLoading ? "Changing..." : "Change Password"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
