// Supabase Edge Function: send-auth-email
// Handles the send_email auth hook — renders branded email templates and sends via Resend.
// Runtime: Deno 2

import { type EmailLocale, renderAuthEmail } from "./templates.ts";

interface SendEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      locale?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new: string;
    token_hash_new: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload: SendEmailPayload = await req.json();
    const { user, email_data } = payload;

    // Validate required fields
    if (!user?.email || !email_data?.token_hash || !email_data?.email_action_type) {
      console.error("[send-auth-email] Invalid payload: missing required fields");
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate environment variables
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("[send-auth-email] RESEND_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      console.error("[send-auth-email] SUPABASE_URL not set");
      return new Response(
        JSON.stringify({ error: "SUPABASE_URL not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const locale = (user.user_metadata?.locale === "es" ? "es" : "en") as EmailLocale;
    const emailFrom = Deno.env.get("EMAIL_FROM") ?? "Argent <noreply@argent.photo>";

    // Build confirmation URL pointing to Supabase's auth verification endpoint.
    // Supabase verifies the token and redirects the user to redirect_to.
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;

    const { subject, html } = renderAuthEmail({
      emailActionType: email_data.email_action_type,
      confirmationUrl,
      locale,
    });

    // Send via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [user.email],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      console.error("[send-auth-email] Resend API error:", resendResponse.status, errorBody);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-auth-email] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
