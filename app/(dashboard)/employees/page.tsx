"use client";

import { EmployeesList } from "@/components/EmployeesList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Link href="/candidates">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Employee
          </Button>
        </Link>
      </div>
      <EmployeesList />
    </div>
  );
}