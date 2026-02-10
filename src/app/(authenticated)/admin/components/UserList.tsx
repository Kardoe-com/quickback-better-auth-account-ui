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
import authClient from "@/auth/authClient";
import { User, ListUsersParams } from "../types";
import {
    Search,
    MoreHorizontal,
    Pencil,
    Ban,
    CheckCircle,
    Key,
    Monitor,
    Trash2,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    RefreshCw,
} from "lucide-react";

interface UserListProps {
    onEditUser: (user: User) => void;
    onBanUser: (user: User) => void;
    onUnbanUser: (user: User) => void;
    onChangePassword: (user: User) => void;
    onViewSessions: (user: User) => void;
    onDeleteUser: (user: User) => void;
    onImpersonateUser: (user: User) => void;
    refreshTrigger?: number;
}

export function UserList({
    onEditUser,
    onBanUser,
    onUnbanUser,
    onChangePassword,
    onViewSessions,
    onDeleteUser,
    onImpersonateUser,
    refreshTrigger,
}: UserListProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [searchField, setSearchField] = useState<"email" | "name">("email");
    const [showAnonymous, setShowAnonymous] = useState(false);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const queryParams: ListUsersParams = {
                limit: pageSize,
                offset: (currentPage - 1) * pageSize,
                sortBy,
                sortDirection,
            };

            if (searchValue) {
                queryParams.searchValue = searchValue;
                queryParams.searchField = searchField;
                queryParams.searchOperator = "contains";
            }

            const { data, error: fetchError } = await authClient.admin.listUsers({
                query: queryParams,
            });

            if (fetchError) {
                setError(fetchError.message || "Failed to fetch users");
                return;
            }

            if (data) {
                const allUsers = data.users as User[];
                if (!showAnonymous) {
                    const filtered = allUsers.filter(u => !u.email?.includes('@anon.'));
                    setUsers(filtered);
                    setTotal(data.total - (allUsers.length - filtered.length));
                } else {
                    setUsers(allUsers);
                    setTotal(data.total);
                }
            }
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, searchValue, searchField, sortBy, sortDirection, showAnonymous]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, refreshTrigger]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchUsers();
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

    const getUserInitials = (name: string | undefined, email: string | undefined) => {
        if (name) {
            const parts = name.split(" ");
            return parts
                .map((part) => part[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return email ? email[0].toUpperCase() : "?";
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getRoleBadgeVariant = (role: string | null | undefined) => {
        switch (role) {
            case "admin":
                return "default";
            default:
                return "secondary";
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
                            placeholder="Search users..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={searchField}
                        onValueChange={(value: "email" | "name") => setSearchField(value)}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit" variant="secondary">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>
                <Button variant="outline" onClick={() => fetchUsers()}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filters</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            onClick={() => { setShowAnonymous(!showAnonymous); setCurrentPage(1); }}
                        >
                            <span className="flex items-center gap-2">
                                {showAnonymous ? <CheckCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
                                Show anonymous users
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {error}
                </p>
            )}

            {/* User Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSort("name")}
                                    className="-ml-3"
                                >
                                    User
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
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
                                                <Skeleton className="h-3 w-[200px]" />
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
                                        <Skeleton className="h-8 w-8 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <p className="text-muted-foreground">No users found.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.image || undefined} />
                                                <AvatarFallback className="bg-slate-700 text-white">
                                                    {getUserInitials(user.name, user.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                            {user.role || "user"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.banned ? (
                                            <Badge variant="destructive">Banned</Badge>
                                        ) : user.emailVerified ? (
                                            <Badge
                                                variant="outline"
                                                className="text-green-600 border-green-600"
                                            >
                                                Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Unverified</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(user.createdAt)}
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
                                                <DropdownMenuItem onClick={() => onEditUser(user)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onChangePassword(user)}
                                                >
                                                    <Key className="h-4 w-4 mr-2" />
                                                    Change Password
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onViewSessions(user)}
                                                >
                                                    <Monitor className="h-4 w-4 mr-2" />
                                                    View Sessions
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onImpersonateUser(user)}
                                                >
                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                    Impersonate
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {user.banned ? (
                                                    <DropdownMenuItem
                                                        onClick={() => onUnbanUser(user)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                        Unban User
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => onBanUser(user)}
                                                        className="text-orange-600"
                                                    >
                                                        <Ban className="h-4 w-4 mr-2" />
                                                        Ban User
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => onDeleteUser(user)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete User
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
                        {Math.min(currentPage * pageSize, total)} of {total} users
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
