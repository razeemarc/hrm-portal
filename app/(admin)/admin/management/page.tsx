"use client";

import { useMemo, useState } from "react";
import { useQueries, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarDays, CheckCircle2, Clock3, Users, XCircle } from "lucide-react";
import { format } from "date-fns";

const formatTime = (value?: number) => {
  if (!value) return "--";
  return format(new Date(value), "hh:mm a");
};

const formatHours = (value?: number) => {
  if (value === undefined) return "--";
  return `${value.toFixed(2)}h`;
};

export default function ManagementPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const users = useQuery(api.functions.auth.getUsers);
  const employees = useMemo(
    () => (users ?? []).filter((user) => user.role === "employee"),
    [users]
  );
  const attendanceByEmployee = useQueries(
    useMemo(
      () =>
        Object.fromEntries(
          employees.map((employee) => [
            employee._id,
            {
              query: api.functions.attendance.getAttendanceByDate,
              args: { userId: employee._id, date: selectedDate },
            },
          ])
        ),
      [employees, selectedDate]
    )
  );

  const records = useMemo(() => {
    if (!users) return undefined;
    if (employees.some((employee) => attendanceByEmployee[employee._id] === undefined)) {
      return undefined;
    }

    return employees.map((employee) => {
      const attendance = attendanceByEmployee[employee._id];
      const hasAttendance = attendance !== null;

      return {
        userId: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        jobTitle: employee.jobTitle,
        employeeId: employee.employeeId,
        status: hasAttendance ? attendance.status || "present" : "absent",
        checkIn: hasAttendance ? attendance.checkIn : undefined,
        checkOut: hasAttendance ? attendance.checkOut : undefined,
        workingHours: hasAttendance ? attendance.workingHours : undefined,
      };
    });
  }, [attendanceByEmployee, employees, users]);

  const summary = useMemo(() => {
    if (!records) {
      return { total: 0, present: 0, absent: 0, checkedOut: 0 };
    }

    return records.reduce(
      (acc, record) => {
        acc.total += 1;
        if (record.status === "present") acc.present += 1;
        if (record.status === "absent") acc.absent += 1;
        if (record.checkOut) acc.checkedOut += 1;
        return acc;
      },
      { total: 0, present: 0, absent: 0, checkedOut: 0 }
    );
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Management</h1>
          <p className="text-sm text-muted-foreground">
            Attendance overview with present, absent, check-in, and check-out details.
          </p>
        </div>
        <div className="w-full md:w-64">
          <label className="mb-2 block text-sm font-medium">Attendance Date</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Employees</CardDescription>
            <CardTitle className="flex items-center justify-between text-3xl font-bold">
              {summary.total}
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Present</CardDescription>
            <CardTitle className="flex items-center justify-between text-3xl font-bold text-green-600">
              {summary.present}
              <CheckCircle2 className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Absent</CardDescription>
            <CardTitle className="flex items-center justify-between text-3xl font-bold text-red-600">
              {summary.absent}
              <XCircle className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Checked Out</CardDescription>
            <CardTitle className="flex items-center justify-between text-3xl font-bold text-blue-600">
              {summary.checkedOut}
              <Clock3 className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Attendance Register</CardTitle>
            <CardDescription>
              {format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMMM dd, yyyy")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Present and absent status with side-by-side check-in/check-out time
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead className="text-right">Working Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!records ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Loading attendance management...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No employee attendance data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.userId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{record.name}</span>
                          <span className="text-xs text-muted-foreground">{record.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{record.department || "--"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            record.status === "present"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }
                        >
                          {record.status === "present" ? "Present" : "Absent"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTime(record.checkIn)}</TableCell>
                      <TableCell>{formatTime(record.checkOut)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatHours(record.workingHours)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
