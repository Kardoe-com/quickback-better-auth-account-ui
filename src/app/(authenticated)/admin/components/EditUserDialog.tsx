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
import authClient from "@/auth/authClient";
import { User, USER_ROLES } from "../types";
import { Pencil } from "lucide-react";

interface EditUserDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserUpdated: () => void;
}

export function EditUserDialog({
    user,
    open,
    onOpenChange,
    onUserUpdated,
}: EditUserDialogProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"user" | "admin">("user");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
            setRole((user.role as "user" | "admin") || "user");
        }
    }, [user]);

    const handleClose = () => {
        setError("");
        onOpenChange(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        setError("");

        try {
            // Update user data
            const { error: updateError } = await authClient.admin.updateUser({
                userId: user.id,
                data: { name, email },
            });

            if (updateError) {
                setError(updateError.message || "Failed to update user");
                return;
            }

            // Update role if changed
            if (role !== user.role) {
                const { error: roleError } = await authClient.admin.setRole({
                    userId: user.id,
                    role,
                });

                if (roleError) {
                    setError(roleError.message || "Failed to update role");
                    return;
                }
            }

            onUserUpdated();
            handleClose();
        } catch (err) {
            console.error("Error updating user:", err);
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
                        <Pencil className="h-5 w-5" />
                        Edit User
                    </DialogTitle>
                    <DialogDescription>
                        Update user information and role.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={role} onValueChange={(v: string) => setRole(v as "user" | "admin")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {USER_ROLES.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
