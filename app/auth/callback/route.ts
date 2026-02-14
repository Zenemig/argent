import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/send-welcome";
import type { EmailLocale } from "@/lib/email/templates/types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send welcome email on first login (email confirmation)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && !user.user_metadata?.welcome_email_sent) {
          const locale =
            (user.user_metadata?.locale as EmailLocale) ?? "en";
          await sendWelcomeEmail({ email: user.email!, locale });

          // Mark as sent to prevent duplicate welcome emails
          await supabase.auth.updateUser({
            data: { welcome_email_sent: true },
          });
        }
      } catch (e) {
        // Welcome email is non-critical — don't block the redirect
        console.error("[auth/callback] Failed to send welcome email:", e);
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
