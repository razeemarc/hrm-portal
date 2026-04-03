import Link from "next/link";
import { redirect } from "next/navigation";
import { stackServerApp } from "@/lib/stack/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck, ScrollText, Building2 } from "lucide-react";

export default async function Home() {
  const user = await stackServerApp.getUser();
  if (user) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">HRM Portal</h1>
          <div className="flex gap-4">
            <Link href="/handler/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/handler/signup">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Modern HR Management Solution
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your hiring process with invite-based onboarding, document verification, and offer letter management.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Candidate Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track candidates through the entire hiring pipeline from invitation to hire.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileCheck className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Document Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload and verify candidate documents including resumes, ID proofs, and certificates.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <ScrollText className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Offer Letters</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate and send professional offer letters for interns and full-time employees.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Building2 className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Employee Records</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Maintain comprehensive records of all hired employees in one place.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Ready to streamline your HR processes?
          </p>
          <Link href="/handler/signup">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}