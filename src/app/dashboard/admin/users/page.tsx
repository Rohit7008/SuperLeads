"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsers } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Shield, MoreHorizontal, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const [updatingParams, setUpdatingParams] = useState<{ id: string, role: string } | null>(null);

    const { data: users, isLoading } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    const updateUserRole = async (id: string, newRole: 'admin' | 'user') => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        setUpdatingParams({ id, role: newRole });
        try {
            await api.put("/users", { id, role: newRole });
            queryClient.invalidateQueries({ queryKey: ["users"] });
        } catch (error: any) {
            console.error("Failed to update role:", error);
            const message = error.response?.data?.detail || error.message || "Failed to update user role.";
            alert(`Error: ${message}`);
        } finally {
            setUpdatingParams(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading users...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">User Management</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Manage user access and permissions.</p>
                </div>
                <div className="hidden md:block">
                </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                <Table>
                    <TableHeader className="bg-zinc-100 dark:bg-zinc-800">
                        <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                            <TableHead className="font-bold text-xs uppercase text-muted-foreground tracking-wider pl-6 py-3">User</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-muted-foreground tracking-wider py-3">Email</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-muted-foreground tracking-wider py-3">Role</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-muted-foreground tracking-wider text-right pr-6 py-3">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user) => (
                            <TableRow key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                <TableCell className="font-medium pl-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#5D5FEF]/10 text-[#5D5FEF] flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-zinc-950">
                                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user.name || "No Name"}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-zinc-600 dark:text-zinc-400 font-medium text-sm">{user.email}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={`capitalize px-2.5 py-0.5 h-6 text-xs font-semibold border-0 ${user.role === 'admin'
                                                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                                }`}
                                        >
                                            {user.role === 'admin' && <Shield className="w-3 h-3 mr-1.5 fill-current opacity-50" />}
                                            {user.role}
                                        </Badge>
                                        {updatingParams?.id === user.id && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-lg min-w-[160px] p-2">
                                            <DropdownMenuLabel className="font-bold text-[10px] text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 rounded-sm mb-1 uppercase tracking-wider">Actions</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/admin/users/${user.id}`} className="cursor-pointer flex w-full items-center px-2 py-1.5 rounded-sm text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                    <span>View Profile</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            {user.id !== "current_user_id_placeholder" && (
                                                <>
                                                    {user.role !== 'admin' && (
                                                        <DropdownMenuItem onClick={() => updateUserRole(user.id, 'admin')} className="cursor-pointer px-2 py-1.5 rounded-sm text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                            <span>Make Admin</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user.role === 'admin' && (
                                                        <DropdownMenuItem onClick={() => updateUserRole(user.id, 'user')} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer px-2 py-1.5 rounded-sm text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                            <span>Remove Admin</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator className="my-1 bg-border" />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
                                                                api.delete(`/users?id=${user.id}`)
                                                                    .then(() => {
                                                                        queryClient.invalidateQueries({ queryKey: ["users"] });
                                                                    })
                                                                    .catch(err => alert("Failed to delete user: " + (err.response?.data?.detail || err.message)));
                                                            }
                                                        }}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer px-2 py-1.5 rounded-sm text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                    >
                                                        <span>Delete User</span>
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
