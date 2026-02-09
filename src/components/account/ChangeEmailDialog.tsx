"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authClient from "@/auth/authClient";
import { Mail, AlertCircle } from "lucide-react";

interface ChangeEmailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentEmail?: string;
}

export function ChangeEmailDialog({ isOpen, onClose, currentEmail }: ChangeEmailDialogProps) {
    const [newEmail, setNewEmail] = useState("");
    const [isChanging, setIsChanging] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Initialize form with current value
    useEffect(() => {
        if (isOpen) {
            setNewEmail("");
            setError("");
            setSuccessMessage("");
        }
    }, [isOpen]);

    const handleClose = () => {
        setNewEmail("");
        setError("");
        setSuccessMessage("");
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsChanging(true);
        setError("");
        setSuccessMessage("");

        try {
            // Validate email is different
            if (newEmail.trim() === currentEmail) {
                setError("Please enter a different email address");
                setIsChanging(false);
                return;
            }

            // Validate email format
            if (!newEmail.trim() || !newEmail.includes("@")) {
                setError("Please enter a valid email address");
                setIsChanging(false);
                return;
            }

            // Initiate email change (requires verification)
            const { error: changeEmailError } = await authClient.changeEmail({
                newEmail: newEmail.trim(),
                callbackURL: "/profile",
            });

            if (changeEmailError) {
                setError(changeEmailError.message || "Failed to initiate email change");
                setIsChanging(false);
                return;
            }

            // Show success message
            setSuccessMessage(
                `A verification email has been sent to ${newEmail.trim()}. Please check your email and click the verification link to complete the change. Your current email (${currentEmail}) will remain active until the new email is verified.`
            );
        } catch (err) {
            console.error("Error changing email:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsChanging(false);
        }
    };

    const hasValidEmail = newEmail.trim() !== "" && newEmail.includes("@") && newEmail.trim() !== currentEmail;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Change Email Address
                    </DialogTitle>
                    <DialogDescription>
                        Update your email address. A verification email will be sent to the new address.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-email">Current Email</Label>
                            <Input
                                id="current-email"
                                value={currentEmail || ""}
                                disabled
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-email">New Email Address</Label>
                            <Input
                                id="new-email"
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="newemail@example.com"
                                required
                                disabled={isChanging || !!successMessage}
                                autoFocus
                            />
                        </div>

                        {!successMessage && (
                            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-700">
                                    <p className="font-medium mb-1">Email Change Process:</p>
                                    <ol className="list-decimal list-inside space-y-1 ml-2">
                                        <li>A verification email will be sent to your new email address</li>
                                        <li>Click the verification link in that email</li>
                                        <li>Your email will be updated after verification</li>
                                        <li>Your current email remains active until verification is complete</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-700 whitespace-pre-line">{successMessage}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isChanging}
                        >
                            {successMessage ? "Close" : "Cancel"}
                        </Button>
                        {!successMessage && (
                            <Button
                                type="submit"
                                disabled={isChanging || !hasValidEmail}
                            >
                                {isChanging ? "Sending..." : "Send Verification Email"}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


