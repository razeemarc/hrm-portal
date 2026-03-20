"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");

  // Employees = candidates with status "hired"
  const hiredCandidates = useQuery(api.functions.candidates.getCandidatesByStatus, {
    status: "hired",
  });

  const employees = hiredCandidates ?? [];

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPackage = employees.reduce((sum, e) => sum + (e.package ?? 0), 0);
  const avgSalary = employees.length > 0 ? Math.round(totalPackage / employees.length) : 0;
  const departments = new Set(employees.map((e) => e.department).filter(Boolean)).size;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Employees</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            {hiredCandidates === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{employees.length}</div>
                <div className="text-sm text-gray-500">Total Employees</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {hiredCandidates === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{departments}</div>
                <div className="text-sm text-gray-500">Departments</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {hiredCandidates === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {avgSalary > 0 ? `$${avgSalary.toLocaleString()}` : "—"}
                </div>
                <div className="text-sm text-gray-500">Avg. Salary</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          {hiredCandidates === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Hired Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      {search
                        ? "No employees match your search"
                        : "No hired employees yet. Hire candidates from the Candidates page."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">
                            {employee.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role ?? "—"}</TableCell>
                      <TableCell>
                        {employee.department ? (
                          <Badge variant="outline">{employee.department}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="capitalize">
                        {employee.offerType ?? "—"}
                      </TableCell>
                      <TableCell>
                        {employee.package
                          ? `$${employee.package.toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell suppressHydrationWarning>
                        {employee.hiredAt
                          ? new Date(employee.hiredAt).toLocaleDateString()
                          : "—"}
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