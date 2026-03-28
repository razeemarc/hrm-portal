"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Loader2, Mail, Phone, DollarSign } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  generated: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

export default function PayslipsPage() {
  // ── Convex queries ──
  const payslipsData = useQuery(api.functions.payslips.getPayslips);

  const payslips = payslipsData ?? [];
  const currentMonth = new Date().toISOString().slice(0, 7); // "2024-01"

  // Calculate stats
  const totalPayslips = payslips.length;
  const thisMonthPayslips = payslips.filter((p) => p.month === currentMonth);
  const pendingPayments = payslips.filter((p) => p.status === "generated").length;
  const paidThisMonth = thisMonthPayslips.filter((p) => p.status === "paid").length;
  const thisMonthTotal = thisMonthPayslips.reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payslips</h1>
        <Link href="/payslips/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Payslip
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            {payslipsData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalPayslips}</div>
                <div className="text-sm text-gray-500">Total Payslips</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {payslipsData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">
                  ₹{(thisMonthTotal / 100000).toFixed(1)}L
                </div>
                <div className="text-sm text-gray-500">This Month Total</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {payslipsData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {pendingPayments}
                </div>
                <div className="text-sm text-gray-500">Pending Payments</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {payslipsData === undefined ? (
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {paidThisMonth}
                </div>
                <div className="text-sm text-gray-500">Paid This Month</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payslips Table */}
      <Card>
        <CardContent className="p-0">
          {payslipsData === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No payslips created yet
                    </TableCell>
                  </TableRow>
                ) : (
                  payslips.map((payslip) => (
                    <TableRow key={payslip._id}>
                      <TableCell>
                        <div className="font-medium hover:underline">
                          <Link href={`/candidates/${payslip.employeeId}`}>
                            {payslip.employee?.name ?? "Unknown"}
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {payslip.employee?.email ?? ""}
                        </div>
                        {payslip.employee?.phone && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {payslip.employee.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(payslip.month + "-01").toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>₹{payslip.baseSalary.toLocaleString()}</TableCell>
                      <TableCell>₹{payslip.grossEarnings.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">
                        -₹{payslip.totalDeductions.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        ₹{payslip.netSalary.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[payslip.status] ?? ""}>
                          {payslip.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/payslips/${payslip._id}`}>
                          <Button variant="outline" size="sm" title="View Payslip">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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
