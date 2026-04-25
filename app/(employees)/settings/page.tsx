"use client";

import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Shield, User } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeSettingsPage() {
  const user = useUser({ or: "redirect" });
  const dbUser = useQuery(
    api.functions.auth.getUserByEmail,
    user?.primaryEmail ? { email: user.primaryEmail } : "skip"
  );
  const syncUser = useMutation(api.functions.auth.syncUser);
  const updateUserProfile = useMutation(api.functions.auth.updateUserProfile);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dbUser?.name) {
      setName(dbUser.name);
      return;
    }

    if (user?.displayName) {
      setName(user.displayName);
    }
  }, [dbUser?.name, user?.displayName]);

  const handleSave = async () => {
    if (!user?.primaryEmail) {
      toast.error("Unable to find your account email");
      return;
    }

    setSaving(true);
    try {
      if (user.update) {
        await user.update({ displayName: name });
      }

      const userId = await syncUser({
        name,
        email: user.primaryEmail,
        stackUserId: user.id,
      });

      if (!userId) {
        throw new Error("Authentication is still syncing. Please try again.");
      }

      await updateUserProfile({
        id: userId,
        name,
      });

      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Employee settings save error:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (dbUser === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your employee profile information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Settings
          </CardTitle>
          <CardDescription>
            Update the information shown in your employee profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="employee-name">Full Name</Label>
            <Input
              id="employee-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="employee-email"
                value={user?.primaryEmail || dbUser?.email || ""}
                disabled
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your login email is managed by Stack Auth and cannot be edited here.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Employment Summary
          </CardTitle>
          <CardDescription>
            Quick view of your role and account information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{dbUser?.role || "employee"}</Badge>
            {dbUser?.department ? <Badge variant="secondary">{dbUser.department}</Badge> : null}
            {dbUser?.jobTitle ? <Badge variant="secondary">{dbUser.jobTitle}</Badge> : null}
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Employee ID</p>
              <p className="text-sm text-muted-foreground">{dbUser?.employeeId || "--"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Manager</p>
              <p className="text-sm text-muted-foreground">{dbUser?.manager || "--"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Work Schedule</p>
              <p className="text-sm text-muted-foreground">{dbUser?.workSchedule || "--"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Benefits</p>
              <p className="text-sm text-muted-foreground">{dbUser?.benefits || "--"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
