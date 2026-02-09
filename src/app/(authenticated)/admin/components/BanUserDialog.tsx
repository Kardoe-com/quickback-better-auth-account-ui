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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import authClient from "@/auth/authClient";
import { User } from "../types";
import { Ban } from "lucide-react";

interface BanUserDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserBanned: () => void;
}

const BAN_DURATIONS = [
    { value: "permanent", label: "Permanent" },
    { value: "1hour", label: "1 Hour", seconds: 60 * 60 },
    { value: "1day", label: "1 Day", seconds: 60 * 60 * 24 },
    { value: "7days", label: "7 Days", seconds: 60 * 60 * 24 * 7 },
    { value: "30days", label: "30 Days", seconds: 60 * 60 * 24 * 30 },
    { value: "90days", label: "90 Days", seconds: 60 * 60 * 24 * 90 },
];

export function BanUserDialog({
    user,
    open,
    onOpenChange,
    onUserBanned,
}: BanUserDialogProps) {
    const [reason, setReason] = useState("");
    const [duration, setDuration] = useState("permanent");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const resetForm = () => {
        setReason("");
        setDuration("permanent");
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        setError("");

        try {
            const selectedDuration = BAN_DURATIONS.find((d) => d.value === duration);
            const banExpiresIn = selectedDuration?.seconds;

            const { error: banError } = await authClient.admin.banUser({
                userId: user.id,
                banReason: reason || undefined,
                banExpiresIn,
            });

            if (banError) {
                setError(banError.message || "Failed to ban user");
                return;
            }

            onUserBanned();
            handleClose();
        } catch (err) {
            console.error("Error banning user:", err);
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
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Ban className="h-5 w-5" />
                        Ban User
                    </DialogTitle>
                    <DialogDescription>
                        Ban <span className="font-medium">{user.name}</span> ({user.email}) from signing in.
                        All their existing sessions will be revoked.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="ban-duration">Ban Duration</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BAN_DURATIONS.map((d) => (
                                        <SelectItem key={d.value} value={d.value}>
                                            {d.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="ban-reason">Reason (optional)</Label>
                            <Textarea
                                id="ban-reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter the reason for banning this user..."
                                rows={3}
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
                        <Button type="submit" variant="destructive" disabled={isLoading}>
                            {isLoading ? "Banning..." : "Ban User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
