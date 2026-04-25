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
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleEdit = (user: any) => {
    setEditingUser({
      userId: user._id,
      stackUserId: user.stackUserId,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsCreateDrawerOpen(true);
  };

  const handleDrawerClose = (open: boolean) => {
    setIsCreateDrawerOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage HR, Accountant, and Employee users.
          </p>
        </div>
        <Button onClick={() => {
          setEditingUser(null);
          setIsCreateDrawerOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <UserManagementList onEdit={handleEdit} />

      <Sheet open={isCreateDrawerOpen} onOpenChange={handleDrawerClose}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-l p-0 shadow-2xl sm:max-w-lg"
        >
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold tracking-tight">
                {editingUser ? "Edit User" : "Create User"}
              </SheetTitle>
              <SheetDescription className="text-sm">
                {editingUser 
                  ? "Update user details and role." 
                  : "Enter the user details and choose a role."}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-2">
              <UserManagementForm
                initialData={editingUser}
                onSuccess={() => handleDrawerClose(false)}
                onCancel={() => handleDrawerClose(false)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
