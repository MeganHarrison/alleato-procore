import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const isNewUser = requestUrl.searchParams.get("new_user") === "true";

  if (code) {
    const supabase = await createClient();

    try {
      const { data } = await supabase.auth.exchangeCodeForSession(code);

      // Check if this is a new user (account created < 30 seconds ago)
      if (data?.user) {
        const createdAt = new Date(data.user.created_at);
        const now = new Date();
        const diffSeconds = (now.getTime() - createdAt.getTime()) / 1000;

        // If user was created in the last 30 seconds, this is a new signup
        if (diffSeconds < 30 || isNewUser) {
          return NextResponse.redirect(`${origin}/welcome`);
        }
      }
    } catch (error) {
      console.error("Error exchanging code for session:", error);
      // Redirect to login with error
      return NextResponse.redirect(
        `${origin}/auth/login?error=auth_callback_failed`,
      );
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/`);
}
