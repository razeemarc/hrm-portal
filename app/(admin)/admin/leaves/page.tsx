"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@stackframe/stack";
import { format } from "date-fns";
import {
  Check,
  X,
  Loader2,
  MessageSquare,
  Info,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminLeavesPage() {
  const user = useUser();
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [comments, setComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const convexUser = useQuery(api.functions.auth.getUserByEmail, 
    user?.primaryEmail ? { email: user.primaryEmail } : "skip"
  );
  
  const allLeaves = useQuery(api.functions.leaves.getAllLeaves);
  const updateLeaveStatus = useMutation(api.functions.leaves.updateLeaveStatus);

  async function handleStatusUpdate(leave: any, status: "approved" | "rejected") {
    if (!convexUser) return;
    
    setIsProcessing(true);
    try {
      await updateLeaveStatus({
        leaveId: leave._id,
        status,
        processedBy: convexUser._id,
        comments: comments || undefined,
      });

      // Send email notification to employee
      try {
        await fetch("/api/send-leave-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeEmail: leave.userEmail,
            employeeName: leave.userName,
            leaveType: leave.type,
            startDate: format(new Date(leave.startDate), "PPP"),
            endDate: format(new Date(leave.endDate), "PP"),
            status: status,
            comments: comments || undefined,
            type: "decision",
          }),
        });
      } catch (emailError) {
        console.error("Failed to send employee notification:", emailError);
      }

      toast.success(`Leave request ${status} successfully`);
      setSelectedLeave(null);
      setComments("");
    } catch (error) {
      toast.error("Failed to update leave request");
    } finally {
      setIsProcessing(false);
    }
  }

  if (!user || !convexUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredLeaves = (status?: string) => {
    if (!allLeaves) return [];
    if (!status) return allLeaves;
    return allLeaves.filter(l => l.status === status);
  };

  const LeaveTable = ({ leaves }: { leaves: any[] }) => {
    const totalPages = Math.ceil(leaves.length / ITEMS_PER_PAGE);
    const paginatedLeaves = leaves.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeaves.map((leave) => (
                <TableRow key={leave._id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{leave.userName}</span>
                      <span className="text-xs text-muted-foreground">{leave.userEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{leave.type}</TableCell>
                  <TableCell>{format(new Date(leave.startDate), "PP")}</TableCell>
                  <TableCell>{format(new Date(leave.endDate), "PP")}</TableCell>
                  <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Popover>
                        <PopoverTrigger
                          render={(props) => (
                            <Button {...props} variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Info className="h-4 w-4" />
                            </Button>
                          )}
                        />
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Request Details</h4>
                            <p className="text-sm text-muted-foreground">
                              <strong>Reason:</strong> {leave.reason}
                            </p>
                            <p className="text-xs text-muted-foreground pt-2">
                              Applied on {format(new Date(leave.appliedAt), "PPpp")}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {leave.status === "pending" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
                          onClick={() => setSelectedLeave(leave)}
                        >
                          Process
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, leaves.length)} of{" "}
              {leaves.length} requests
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leave Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review and process employee leave applications.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{allLeaves?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {allLeaves?.filter(l => l.status === "pending").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {allLeaves?.filter(l => l.status === "approved").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {allLeaves?.filter(l => l.status === "rejected").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger 
            value="pending" 
            className="gap-2 data-[state=active]:text-yellow-600"
            onClick={() => setCurrentPage(1)}
          >
            Pending
            <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-700">{allLeaves?.filter(l => l.status === "pending").length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="approved" 
            className="gap-2 data-[state=active]:text-green-600"
            onClick={() => setCurrentPage(1)}
          >
            Approved
            <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">{allLeaves?.filter(l => l.status === "approved").length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="rejected" 
            className="gap-2 data-[state=active]:text-red-600"
            onClick={() => setCurrentPage(1)}
          >
            Rejected
            <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700">{allLeaves?.filter(l => l.status === "rejected").length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            className="gap-2"
            onClick={() => setCurrentPage(1)}
          >
            All Requests
            <Badge variant="secondary" className="ml-1 bg-muted/50">{allLeaves?.length || 0}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {allLeaves === undefined ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <LeaveTable leaves={filteredLeaves("pending")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {allLeaves === undefined ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <LeaveTable leaves={filteredLeaves("approved")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {allLeaves === undefined ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <LeaveTable leaves={filteredLeaves("rejected")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {allLeaves === undefined ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <LeaveTable leaves={allLeaves} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedLeave} onOpenChange={(open) => !open && setSelectedLeave(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Process Leave Request</DialogTitle>
            <DialogDescription>
              Review the request from <strong>{selectedLeave?.userName}</strong> and provide feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
              <p><strong>Type:</strong> <span className="capitalize">{selectedLeave?.type}</span></p>
              <p><strong>Duration:</strong> {selectedLeave && `${format(new Date(selectedLeave.startDate), "PP")} - ${format(new Date(selectedLeave.endDate), "PP")}`}</p>
              <p><strong>Reason:</strong> {selectedLeave?.reason}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments (Optional)</label>
              <Textarea 
                placeholder="Add a reason for approval or rejection..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => handleStatusUpdate(selectedLeave, "rejected")}
              disabled={isProcessing}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleStatusUpdate(selectedLeave, "approved")}
              disabled={isProcessing}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
