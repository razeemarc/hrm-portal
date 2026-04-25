"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@stackframe/stack";
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Calendar as CalendarIcon, 
  Timer,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  TrendingUp,
  FileCheck
} from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function AttendancePage() {
  const user = useUser({ or: 'redirect' });
  const convexUser = useQuery(
    api.functions.auth.getUserByEmail,
    user?.primaryEmail ? { email: user.primaryEmail } : "skip"
  );
  const syncUser = useMutation(api.functions.auth.syncUser);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRepairingProfile, setIsRepairingProfile] = useState(false);
  
  const today = format(new Date(), "yyyy-MM-dd");
  
  // @ts-ignore
  const attendanceHistory = useQuery(api.functions.attendance.getAttendance, 
    convexUser ? { userId: convexUser._id } : "skip"
  );
  
  // @ts-ignore
  const todayAttendance = useQuery(api.functions.attendance.getAttendanceByDate,
    convexUser ? { userId: convexUser._id, date: today } : "skip"
  );

  // @ts-ignore
  const checkIn = useMutation(api.functions.attendance.checkIn);
  // @ts-ignore
  const checkOut = useMutation(api.functions.attendance.checkOut);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.primaryEmail || convexUser !== null || isRepairingProfile) {
      return;
    }

    let cancelled = false;

    const repairProfile = async () => {
      try {
        setIsRepairingProfile(true);
        const syncedUserId = await syncUser({
          name: user.displayName || "Employee",
          email: user.primaryEmail || "",
          stackUserId: user.id,
        });
        if (!syncedUserId) {
          return;
        }
      } catch (error) {
        console.error("AttendancePage: Failed to sync employee profile", error);
      } finally {
        if (!cancelled) {
          setIsRepairingProfile(false);
        }
      }
    };

    void repairProfile();

    return () => {
      cancelled = true;
    };
  }, [convexUser, isRepairingProfile, syncUser, user?.displayName, user?.primaryEmail]);

  if (!user || convexUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!convexUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-6 shadow-xl border-destructive/20">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
            <p className="text-muted-foreground">
              {isRepairingProfile
                ? "We're syncing your employee profile. Please wait a moment and try again."
                : "We couldn't find your employee record. Please contact HR to set up your profile."}
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleCheckIn = async () => {
    try {
      await checkIn({ userId: convexUser._id, date: today });
      toast.success("Shift started! Have a great day.");
    } catch (error: any) {
      toast.error(error.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;
    try {
      await checkOut({ attendanceId: todayAttendance._id });
      toast.success("Shift ended. See you tomorrow!");
    } catch (error: any) {
      toast.error(error.message || "Failed to check out");
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const getActiveWorkingTime = () => {
    if (!todayAttendance || todayAttendance.checkOut) return null;
    const diff = differenceInSeconds(currentTime, todayAttendance.checkIn);
    return formatDuration(diff);
  };

  const totalWorkingHours = attendanceHistory?.reduce((sum: number, rec: any) => sum + (rec.workingHours ?? 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Time Tracking</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex bg-primary/5 text-primary border-primary/20 px-3 py-1">
              <Briefcase className="h-3 w-3 mr-2" />
              {convexUser.jobTitle || 'Employee'}
            </Badge>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Section: Real-time Clock & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Punch Card */}
          <Card className="lg:col-span-1 shadow-xl border-primary/10 overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
            </div>
            <CardHeader className="pb-2 relative">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Punch Status
              </CardTitle>
              <CardDescription>{format(currentTime, "EEEE, MMMM do, yyyy")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-8 pt-6 relative">
              <div className="text-5xl sm:text-6xl font-mono font-bold tracking-tighter tabular-nums text-foreground drop-shadow-sm">
                {format(currentTime, "HH:mm:ss")}
              </div>
              
              {todayAttendance ? (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Start Time</p>
                      <p className="text-lg font-bold">{format(todayAttendance.checkIn, "hh:mm:ss a")}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <LogIn className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  
                  {!todayAttendance.checkOut ? (
                    <>
                      <div className="flex flex-col items-center p-6 rounded-2xl bg-orange-50 border border-orange-100 shadow-inner">
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-2">Duration Today</span>
                        <span className="text-3xl font-mono font-bold text-orange-700 tabular-nums">
                          {getActiveWorkingTime()}
                        </span>
                      </div>
                      <Button 
                        onClick={handleCheckOut} 
                        className="w-full h-16 text-lg font-bold shadow-lg shadow-destructive/20 hover:scale-[1.02] active:scale-[0.98] transition-all" 
                        variant="destructive"
                      >
                        <LogOut className="mr-3 h-6 w-6" />
                        Punch Out
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center p-6 rounded-2xl bg-green-50 border border-green-100">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                        <FileCheck className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-green-600 mb-1">Shift Completed</span>
                      <span className="text-2xl font-bold text-green-700">
                        {todayAttendance.workingHours?.toFixed(2)} Hours Logged
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="text-center py-8 px-4 rounded-2xl bg-muted/30 border-2 border-dashed border-muted-foreground/20">
                    <p className="text-sm text-muted-foreground italic">Ready to start your work day?</p>
                  </div>
                  <Button 
                    onClick={handleCheckIn} 
                    className="w-full h-16 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <LogIn className="mr-3 h-6 w-6" />
                    Punch In Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Section */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="shadow-sm border-muted/60 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Life-time Contribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold tracking-tight">{totalWorkingHours.toFixed(1)}</p>
                  <span className="text-sm font-medium text-muted-foreground">Total Hours</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Since Joining: <span className="font-bold text-foreground">{convexUser.startDate ? format(convexUser.startDate, "MMM dd, yyyy") : 'Not set'}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-muted/60 bg-gradient-to-br from-white to-green-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Timer className="h-4 w-4 text-green-500" />
                  This Month's Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold tracking-tight">{attendanceHistory?.length || 0}</p>
                  <span className="text-sm font-medium text-muted-foreground">Days Present</span>
                </div>
                <div className="mt-4 w-full bg-muted rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(((attendanceHistory?.length || 0) / 22) * 100, 100)}%` }} />
                </div>
              </CardContent>
            </Card>

            {/* History Table */}
            <Card className="sm:col-span-2 shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Attendance Logs
                  </CardTitle>
                  <CardDescription>Review your daily punch records and working hours.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Export PDF
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border-t overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-bold">Date & Day</TableHead>
                        <TableHead className="font-bold">Check In</TableHead>
                        <TableHead className="font-bold">Check Out</TableHead>
                        <TableHead className="text-right font-bold">Work Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!attendanceHistory ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground/50" />
                          </TableCell>
                        </TableRow>
                      ) : attendanceHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                            No attendance records found yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendanceHistory.map((record: any) => (
                          <TableRow key={record._id} className="hover:bg-muted/20 transition-colors group">
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{format(new Date(record.date), "MMM dd, yyyy")}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                  {format(new Date(record.date), "EEEE")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {format(record.checkIn, "hh:mm a")}
                              </div>
                            </TableCell>
                            <TableCell>
                              {record.checkOut ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                  {format(record.checkOut, "hh:mm a")}
                                </div>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] font-bold uppercase bg-orange-100 text-orange-700 border-orange-200">
                                  In Progress
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono font-bold text-primary group-hover:text-primary transition-colors">
                                {record.workingHours ? `${record.workingHours.toFixed(2)}h` : "—"}
                              </span>
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
        </div>
      </main>
    </div>
  );
}
