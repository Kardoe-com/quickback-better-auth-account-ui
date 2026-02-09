"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { subscriptionApi, SubscriptionListOptions } from "@/lib/subscriptions";
import {
    Subscription,
    SUBSCRIPTION_TIERS,
    SUBSCRIPTION_STATUSES,
    SubscriptionTier,
    SubscriptionStatus,
} from "../types";
import {
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    RefreshCw,
    Building2,
} from "lucide-react";

interface SubscriptionListProps {
    onEditSubscription: (subscription: Subscription) => void;
    onDeleteSubscription: (subscription: Subscription) => void;
    refreshTrigger?: number;
}

export function SubscriptionList({
    onEditSubscription,
    onDeleteSubscription,
    refreshTrigger,
}: SubscriptionListProps) {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [tierFilter, setTierFilter] = useState<SubscriptionTier | "all">("all");
    const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const fetchSubscriptions = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const options: SubscriptionListOptions = {
                limit: pageSize,
                offset: (currentPage - 1) * pageSize,
                sort: sortBy,
                order: sortDirection,
                filters: {},
            };

            if (searchValue) {
                options.filters!.search = searchValue;
            }
            if (tierFilter !== "all") {
                options.filters!.tier = tierFilter;
            }
            if (statusFilter !== "all") {
                options.filters!.status = statusFilter;
            }

            const response = await subscriptionApi.list(options);
            setSubscriptions(response.data);
            setTotal(response.pagination.count);
        } catch (err: any) {
            console.error("Error fetching subscriptions:", err);
            setError(err?.error || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, searchValue, tierFilter, statusFilter, sortBy, sortDirection]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions, refreshTrigger]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchSubscriptions();
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(total / pageSize);

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

    const formatDate = (date: string | null | undefined) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getTierBadgeVariant = (tier: SubscriptionTier) => {
        switch (tier) {
            case "pro":
                return "default";
            default:
                return "secondary";
        }
    };

    const getStatusBadgeVariant = (status: SubscriptionStatus) => {
        switch (status) {
            case "active":
                return "outline" as const;
            case "trialing":
                return "secondary" as const;
            case "cancelled":
                return "destructive" as const;
            case "expired":
                return "destructive" as const;
            default:
                return "outline" as const;
        }
    };

    const getStatusBadgeClass = (status: SubscriptionStatus) => {
        switch (status) {
            case "active":
                return "text-green-600 border-green-600";
            case "trialing":
                return "";
            default:
                return "";
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by organization name or slug..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" variant="secondary">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>
                <Select
                    value={tierFilter}
                    onValueChange={(value) => {
                        setTierFilter(value as SubscriptionTier | "all");
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        {SUBSCRIPTION_TIERS.map((tier) => (
                            <SelectItem key={tier.value} value={tier.value}>
                                {tier.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                        setStatusFilter(value as SubscriptionStatus | "all");
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {SUBSCRIPTION_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => fetchSubscriptions()}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {error}
                </p>
            )}

            {/* Subscription Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">
                                Organization
                            </TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSort("expiresAt")}
                                    className="-ml-3"
                                >
                                    Expires
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSort("createdAt")}
                                    className="-ml-3"
                                >
                                    Created
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            // Loading skeletons
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-[150px]" />
                                                <Skeleton className="h-3 w-[100px]" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-16" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-16" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-8 w-8 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : subscriptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <p className="text-muted-foreground">No subscriptions found.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            subscriptions.map((subscription) => (
                                <TableRow key={subscription.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
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
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getTierBadgeVariant(subscription.tier)}>
                                            {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getStatusBadgeVariant(subscription.status)}
                                            className={getStatusBadgeClass(subscription.status)}
                                        >
                                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(subscription.expiresAt)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(subscription.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onEditSubscription(subscription)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit Subscription
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onDeleteSubscription(subscription)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Subscription
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!isLoading && total > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, total)} of {total} subscriptions
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
