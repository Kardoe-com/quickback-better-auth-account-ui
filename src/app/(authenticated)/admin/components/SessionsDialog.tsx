"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import authClient from "@/auth/authClient";
import { User, Session } from "../types";
import { Monitor, Globe, Clock, Trash2, XCircle } from "lucide-react";

interface SessionsDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SessionsDialog({
    user,
    open,
    onOpenChange,
}: SessionsDialogProps) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [revokingSession, setRevokingSession] = useState<string | null>(null);

    useEffect(() => {
        if (open && user) {
            fetchSessions();
        }
    }, [open, user]);

    const fetchSessions = async () => {
        if (!user) return;

        setIsLoading(true);
        setError("");

        try {
            const { data, error: fetchError } = await authClient.admin.listUserSessions({
                userId: user.id,
            });

            if (fetchError) {
                setError(fetchError.message || "Failed to fetch sessions");
                return;
            }

            setSessions((data?.sessions as Session[]) || []);
        } catch (err) {
            console.error("Error fetching sessions:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevokeSession = async (sessionToken: string) => {
        setRevokingSession(sessionToken);

        try {
            const { error: revokeError } = await authClient.admin.revokeUserSession({
                sessionToken,
            });

            if (revokeError) {
                setError(revokeError.message || "Failed to revoke session");
                return;
            }

            // Remove the revoked session from the list
            setSessions((prev) => prev.filter((s) => s.token !== sessionToken));
        } catch (err) {
            console.error("Error revoking session:", err);
            setError("An unexpected error occurred");
        } finally {
            setRevokingSession(null);
        }
    };

    const handleRevokeAllSessions = async () => {
        if (!user) return;

        setIsLoading(true);
        setError("");

        try {
            const { error: revokeError } = await authClient.admin.revokeUserSessions({
                userId: user.id,
            });

            if (revokeError) {
                setError(revokeError.message || "Failed to revoke sessions");
                return;
            }

            setSessions([]);
        } catch (err) {
            console.error("Error revoking all sessions:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleString();
    };

    const parseUserAgent = (userAgent: string | null | undefined) => {
        if (!userAgent) return "Unknown";
        // Simple parsing - could be enhanced with a library
        if (userAgent.includes("Chrome")) return "Chrome";
        if (userAgent.includes("Firefox")) return "Firefox";
        if (userAgent.includes("Safari")) return "Safari";
        if (userAgent.includes("Edge")) return "Edge";
        return "Unknown Browser";
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Active Sessions
                    </DialogTitle>
                    <DialogDescription>
                        Manage sessions for <span className="font-medium">{user.name}</span> ({user.email}).
                        {sessions.length > 0 && (
                            <span className="ml-1">
                                {sessions.length} active session{sessions.length !== 1 ? "s" : ""}.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">
                            {error}
                        </p>
                    )}

                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Monitor className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No active sessions found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Browser</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                                <span>{parseUserAgent(session.userAgent)}</span>
                                                {session.impersonatedBy && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Impersonated
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                <span>
                                                    {[session.city, session.country]
                                                        .filter(Boolean)
                                                        .join(", ") || "Unknown"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {formatDate(session.createdAt)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {formatDate(session.expiresAt)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRevokeSession(session.token)}
                                                disabled={revokingSession === session.token}
                                            >
                                                <XCircle className="h-4 w-4" />
                                                {revokingSession === session.token ? "..." : "Revoke"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {sessions.length > 0 && (
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            variant="destructive"
                            onClick={handleRevokeAllSessions}
                            disabled={isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke All Sessions
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
