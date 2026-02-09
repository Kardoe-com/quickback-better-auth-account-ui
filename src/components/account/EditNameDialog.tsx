import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authClient from "@/auth/authClient";
import { User } from "lucide-react";

interface EditNameDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentName?: string;
}

export function EditNameDialog({ isOpen, onClose, currentName }: EditNameDialogProps) {
    const [name, setName] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState("");

    // Initialize form with current value
    useEffect(() => {
        if (isOpen) {
            setName(currentName || "");
            setError("");
        }
    }, [isOpen, currentName]);

    const handleClose = () => {
        setName("");
        setError("");
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setError("");

        try {
            // If nothing changed, just close
            if (name.trim() === (currentName || "")) {
                handleClose();
                return;
            }

            // Update name
            const { error: updateError } = await authClient.updateUser({
                name: name.trim(),
            });

            if (updateError) {
                setError(updateError.message || "Failed to update name");
                setIsUpdating(false);
                return;
            }

            // Force session refresh to get updated user data
            // This will trigger the useSession hook to update the UI automatically
            try {
                await authClient.getSession({ query: { disableCookieCache: true } });
            } catch (sessionError) {
                // Non-critical - session will refresh on next request
                console.warn("Failed to refresh session:", sessionError);
            }

            handleClose();
        } catch (err) {
            console.error("Error updating name:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsUpdating(false);
        }
    };

    const hasChanges = name.trim() !== (currentName || "");

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Edit Name
                    </DialogTitle>
                    <DialogDescription>
                        Update your display name.
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
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{error}</p>
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
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isUpdating || !hasChanges}
                        >
                            {isUpdating ? "Updating..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


