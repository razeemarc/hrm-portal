"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
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
import { BriefcaseBusiness, Loader2, Search, ShieldCheck, UserRound } from "lucide-react";

const roleLabelMap: Record<string, string> = {
  hr: "HR",
  accountant: "Accountant",
};

export function UserManagementList() {
  const [search, setSearch] = useState("");
  const users = useQuery(api.functions.auth.getUsers);

  const managementUsers = useMemo(() => {
    return (users ?? []).filter(
      (user) => user.role === "hr" || user.role === "accountant"
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
  const accountantCount = managementUsers.filter(
    (user) => user.role === "accountant"
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
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
                <div className="text-2xl font-bold">{accountantCount}</div>
                <div className="text-sm text-gray-500">Accountants</div>
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
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-gray-500">
                      {search
                        ? "No users match your search."
                        : "No HR or Accountant users created yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {user.role === "hr" ? (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          ) : (
                            <BriefcaseBusiness className="h-3.5 w-3.5" />
                          )}
                          {roleLabelMap[user.role ?? ""] ?? "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell suppressHydrationWarning>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserRound className="h-4 w-4" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
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
