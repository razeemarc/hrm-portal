"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const user = useUser();
  const dbUser = useQuery(api.functions.auth.getCurrentUser);
  const updateProfile = useMutation(api.functions.auth.updateUserProfile);
  const settings = useQuery(api.functions.settings.getSettings);
  const updateSettings = useMutation(api.functions.settings.updateSettings);
  const generateUploadUrl = useMutation(api.functions.settings.generateUploadUrl);
  const getStorageUrl = useAction(api.functions.settings.getStorageUrl);
  
  const [userName, setUserName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile when it arrives
  useEffect(() => {
    if (dbUser) {
      setUserName(dbUser.name || "");
    }
  }, [dbUser]);

  // Load settings when they arrive from Convex
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || "Ladder Academy");
      setCompanyAddress(settings.companyAddress || "123 Tech Street, San Francisco, CA");
      setHrEmail(settings.hrEmail || "hr@ladderacademy.com");
      setLogoUrl(settings.logoUrl || null);
    }
  }, [settings]);

  const handleProfileSave = async () => {
    if (!dbUser) return;
    setSaving(true);
    try {
      await updateProfile({
        id: dbUser._id,
        name: userName,
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Profile save error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        companyName,
        companyAddress,
        hrEmail,
        logoUrl: logoUrl || undefined,
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const onLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file must be under 2MB");
      return;
    }

    setUploading(true);
    try {
      // Step 1: Get upload URL
      const postUrl = await generateUploadUrl();
      
      // Step 2: Upload the file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await result.json();
      
      // Step 3: Get URL for the storage ID
      const url = await getStorageUrl({ storageId });
      
      setLogoUrl(url);
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={dbUser?.email || ""} disabled />
            </div>
            <Button onClick={handleProfileSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>Configure company information for offer letters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>Company Logo</Label>
              <div className="flex items-start gap-4">
                <div className="relative h-24 w-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden group">
                  {logoUrl ? (
                    <>
                      <Image 
                        src={logoUrl} 
                        alt="Company Logo" 
                        fill 
                        className="object-contain"
                      />
                      <button 
                        onClick={removeLogo}
                        className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Upload</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-500">
                    This logo will appear at the top of generated offer letters.
                  </p>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={onLogoUpload}
                    accept="image/*"
                    className="hidden" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {logoUrl ? "Change Logo" : "Choose Logo"}
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-gray-400">PNG or JPG up to 2MB</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input 
                id="companyName" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Company Address</Label>
              <Input 
                id="companyAddress" 
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hrEmail">HR Contact Email</Label>
              <Input 
                id="hrEmail" 
                value={hrEmail}
                onChange={(e) => setHrEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Company Profile"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Email Notifications</div>
                <div className="text-xs text-gray-500">Receive email for new document uploads</div>
              </div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Offer Updates</div>
                <div className="text-xs text-gray-500">Get notified when candidates respond to offers</div>
              </div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-100 bg-red-50/20">
          <CardHeader>
            <CardTitle className="text-red-700 text-base">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Delete Account</div>
                <div className="text-xs text-gray-500">Permanently delete your account and all data</div>
              </div>
              <Button variant="destructive" size="sm">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}