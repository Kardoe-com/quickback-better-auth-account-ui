import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authClient from "@/auth/authClient";
import { Pencil } from "lucide-react";

interface EditProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentName?: string;
    currentEmail?: string;
}

export function EditProfileDialog({ isOpen, onClose, currentName, currentEmail }: EditProfileDialogProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Initialize form with current values
    useEffect(() => {
        if (isOpen) {
            setName(currentName || "");
            setEmail(currentEmail || "");
            setError("");
            setSuccessMessage("");
        }
    }, [isOpen, currentName, currentEmail]);

    const handleClose = () => {
        setName("");
        setEmail("");
        setError("");
        setSuccessMessage("");
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setError("");
        setSuccessMessage("");

        try {
            const updates: { name?: string; email?: string } = {};
            let emailChanged = false;

            // Update name if changed
            if (name !== currentName && name.trim()) {
                updates.name = name.trim();
            }

            // Update email if changed
            if (email !== currentEmail && email.trim()) {
                updates.email = email.trim();
                emailChanged = true;
            }

            // If nothing changed, just close
            if (Object.keys(updates).length === 0) {
                handleClose();
                return;
            }

            // Update name if it changed
            if (updates.name) {
                const { error: updateError } = await authClient.updateUser({
                    name: updates.name,
                });

                if (updateError) {
                    setError(updateError.message || "Failed to update name");
                    setIsUpdating(false);
                    return;
                }
            }

            // Update email if it changed (requires verification)
            if (emailChanged && updates.email) {
                const { error: changeEmailError } = await authClient.changeEmail({
                    newEmail: updates.email,
                    callbackURL: "/profile",
                });

                if (changeEmailError) {
                    setError(changeEmailError.message || "Failed to initiate email change");
                    setIsUpdating(false);
                    return;
                }

                // Show success message about email verification
                setSuccessMessage(
                    `Name updated successfully. A verification email has been sent to ${updates.email}. Please check your email to verify the new address.`
                );
            } else if (updates.name) {
                // Only name was updated
                setSuccessMessage("Name updated successfully.");
            }

            // Force session refresh to get updated user data
            try {
                await authClient.getSession({ query: { disableCookieCache: true } });
            } catch (sessionError) {
                // Non-critical - session will refresh on next request
                console.warn("Failed to refresh session:", sessionError);
            }

            // Refresh the page to show updated data
            window.location.reload();

            // Close dialog after a brief delay if only name was updated
            // If email was changed, keep it open to show the verification message
            if (!emailChanged) {
                setTimeout(() => {
                    handleClose();
                }, 1500);
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsUpdating(false);
        }
    };

    const hasChanges = name.trim() !== (currentName || "") || email.trim() !== (currentEmail || "");

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5" />
                        Edit Profile
                    </DialogTitle>
                    <DialogDescription>
                        Update your name and email address. Email changes require verification.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                                disabled={isUpdating}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                required
                                disabled={isUpdating}
                            />
                            <p className="text-xs text-muted-foreground">
                                Changing your email will require verification. A verification email will be sent to the new address.
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-700">{successMessage}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isUpdating}
                        >
                            {successMessage ? "Close" : "Cancel"}
                        </Button>
                        {!successMessage && (
                            <Button
                                type="submit"
                                disabled={isUpdating || !hasChanges}
                            >
                                {isUpdating ? "Updating..." : "Save Changes"}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}



