"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import authClient from "@/auth/authClient";
import { UserCheck, X } from "lucide-react";

export function ImpersonationBanner() {
    const { data: session } = authClient.useSession();
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check if the current session is an impersonation session
        const sessionData = session as any;
        if (sessionData?.session?.impersonatedBy) {
            setIsImpersonating(true);
        } else {
            setIsImpersonating(false);
        }
    }, [session]);

    const handleStopImpersonating = async () => {
        setIsLoading(true);
        try {
            await authClient.admin.stopImpersonating();
            // Reload the page to refresh the session
            window.location.reload();
        } catch (error) {
            console.error("Error stopping impersonation:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isImpersonating) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    <span className="font-medium">
                        You are currently impersonating{" "}
                        <span className="font-bold">{session?.user?.name || session?.user?.email}</span>
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopImpersonating}
                    disabled={isLoading}
                    className="bg-amber-600 border-amber-700 text-white hover:bg-amber-700 hover:text-white"
                >
                    <X className="h-4 w-4 mr-1" />
                    {isLoading ? "Stopping..." : "Stop Impersonating"}
                </Button>
            </div>
        </div>
    );
}
