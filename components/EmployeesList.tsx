"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Loader2, Eye, Building2, Mail, User, Briefcase, Calendar, DollarSign } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function EmployeesList() {
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      <div>
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
        <CardContent className="p-0 overflow-auto max-h-[60vh]">
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
                        <div className="flex flex-col">
                          <span className="font-medium">{employee.name}</span>
                          <span className="text-xs text-muted-foreground">{employee.email}</span>
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedEmployee(employee)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Employee Details Right Drawer */}
      <Sheet open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-2xl font-bold">Employee Details</SheetTitle>
            <SheetDescription>
              Detailed information for {selectedEmployee?.name}.
            </SheetDescription>
          </SheetHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedEmployee.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-3 w-3 mr-1" />
                    {selectedEmployee.email}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.role ?? "Not specified"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    {selectedEmployee.department ? (
                      <Badge variant="secondary" className="mt-1">{selectedEmployee.department}</Badge>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Compensation</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmployee.package
                        ? `$${selectedEmployee.package.toLocaleString()} (${selectedEmployee.offerType})`
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Hired Date</p>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {selectedEmployee.hiredAt
                        ? new Date(selectedEmployee.hiredAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : "Not recorded"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button variant="outline" className="w-full" onClick={() => setSelectedEmployee(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
