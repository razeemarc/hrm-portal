"use client";

import { useState } from "react";
import { EmployeesList } from "@/components/EmployeesList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { EmployeeForm } from "@/components/EmployeeForm";

export default function EmployeesPage() {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={() => setIsCreateDrawerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Employee
        </Button>
      </div>
      
      <EmployeesList />

      {/* Create Employee Drawer */}
      <Sheet open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg border-l shadow-2xl p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold tracking-tight">Add New Employee</SheetTitle>
              <SheetDescription className="text-sm">
                Enter the employee details below to add them to the system.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-2">
              <EmployeeForm 
                onSuccess={() => setIsCreateDrawerOpen(false)}
                onCancel={() => setIsCreateDrawerOpen(false)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
