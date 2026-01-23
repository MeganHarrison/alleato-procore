import Link from "next/link";
import { CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-900">
                Account Created Successfully!
              </CardTitle>
              <CardDescription className="text-green-700">
                Welcome to Alleato PM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-green-800 leading-relaxed">
                  Your account has been created and is ready to use. You can now
                  sign in to start managing your construction projects.
                </p>
              </div>

              <div className="pt-4">
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link href="/auth/login">
                    Continue to Login
                  </Link>
                </Button>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/"
                  className="text-xs text-green-600 hover:text-green-700 hover:underline"
                >
                  Return to Home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
