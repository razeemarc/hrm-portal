import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountRestrictedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 bg-white rounded-xl shadow-lg">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Account Restricted</h1>
          <p className="text-gray-600">
            Your account has been restricted by the administrator. 
            You no longer have access to the HRM Portal.
          </p>
        </div>

        <div className="pt-4">
          <Button 
            render={<Link href="/handler/logout" />}
            className="w-full"
            nativeButton={false}
          >
            Sign Out
          </Button>
        </div>
        
        <p className="text-xs text-gray-400">
          If you believe this is a mistake, please contact your HR department.
        </p>
      </div>
    </div>
  );
}
