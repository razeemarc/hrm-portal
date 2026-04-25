"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { 
  BriefcaseBusiness, 
  Loader2, 
  Search, 
  ShieldCheck, 
  UserRound, 
  MoreVertical,
  UserX,
  UserCheck,
  Edit,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const roleLabelMap: Record<string, string> = {
  hr: "HR",
  accountant: "Accountant",
  admin: "Admin",
  employee: "Employee",
};

interface UserManagementListProps {
  onEdit: (user: any) => void;
}

export function UserManagementList({ onEdit }: UserManagementListProps) {
  const [search, setSearch] = useState("");
  const users = useQuery(api.functions.auth.getUsers);
  const toggleStatus = useMutation(api.functions.auth.toggleUserBlockStatus);

  const handleToggleBlock = async (user: any) => {
    const newStatus = user.status === "blocked" ? "active" : "blocked";
    try {
      // 1. Update Stack Auth
      const response = await fetch("/api/update-user-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stackUserId: user.stackUserId,
          email: user.email, // Fallback if stackUserId is missing in database
          status: newStatus,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update user status");

      // 2. Update Convex
      await toggleStatus({
        userId: user._id,
        status: newStatus,
      });

      toast.success(
        newStatus === "blocked" 
          ? "User restricted successfully" 
          : "User access restored"
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle user status");
    }
  };

  const managementUsers = useMemo(() => {
    return (users ?? []).filter(
      (user) => ["hr", "accountant", "admin", "employee"].includes(user.role ?? "")
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return managementUsers;
    }

    return managementUsers.filter((user) => {
      return (
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        (user.role ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [managementUsers, search]);

  const hrCount = managementUsers.filter((user) => user.role === "hr").length;
  const adminCount = managementUsers.filter((user) => user.role === "admin").length;
  const employeeCount = managementUsers.filter((user) => user.role === "employee").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            {users === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{managementUsers.length}</div>
                <div className="text-sm text-gray-500">Total Users</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {users === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{adminCount}</div>
                <div className="text-sm text-gray-500">Admins</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {users === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{hrCount}</div>
                <div className="text-sm text-gray-500">HR Users</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {users === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{employeeCount}</div>
                <div className="text-sm text-gray-500">Employees</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="max-h-[60vh] overflow-auto p-0">
          {users === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                      {search
                        ? "No users match your search."
                        : "No management users created yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id} className={user.status === "blocked" ? "bg-red-50/50" : ""}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-2">
                            {user.name}
                            {user.status === "blocked" && (
                              <Badge variant="destructive" className="h-4 px-1 text-[10px] uppercase">
                                Restricted
                              </Badge>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {user.role === "admin" ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                          ) : user.role === "hr" ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <BriefcaseBusiness className="h-3.5 w-3.5" />
                          )}
                          {roleLabelMap[user.role ?? ""] ?? "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.status === "blocked" ? (
                          <div className="flex items-center gap-1.5 text-red-600 font-medium text-xs">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Account restricted
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-green-600 font-medium text-xs">
                            <UserCheck className="h-3.5 w-3.5" />
                            Active
                          </div>
                        )}
                      </TableCell>
                      <TableCell suppressHydrationWarning>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserRound className="h-4 w-4" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={(props) => (
                              <Button {...props} variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            )}
                          />
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onEdit(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleBlock(user)}
                                className={user.status === "blocked" ? "text-green-600" : "text-red-600"}
                              >
                                {user.status === "blocked" ? (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Unblock
                                  </>
                                ) : (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Block
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
