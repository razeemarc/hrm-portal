"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UserManagementForm } from "@/components/UserManagementForm";
import { UserManagementList } from "@/components/UserManagementList";

export function UserManagementPage() {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage HR, Accountant, and Employee users.
          </p>
        </div>
        <Button onClick={() => setIsCreateDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <UserManagementList />

      <Sheet open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-l p-0 shadow-2xl sm:max-w-lg"
        >
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold tracking-tight">
                Create User
              </SheetTitle>
              <SheetDescription className="text-sm">
                Enter the user details and choose a role.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-2">
              <UserManagementForm
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
