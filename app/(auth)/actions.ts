"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = formData.get("next") as string | null;

  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    return { error: "invalidEmail" };
  }
  const passwordResult = passwordSchema.safeParse(password);
  if (!passwordResult.success) {
    return { error: "passwordTooShort" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "invalidCredentials" };
  }

  // Validate next param: prevent open redirect attacks
  const destination =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.includes("://") &&
    !next.includes("\\")
      ? next
      : "/";
  redirect(destination);
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const interest = formData.get("interest") as string | null;

  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    return { error: "invalidEmail" };
  }
  const passwordResult = passwordSchema.safeParse(password);
  if (!passwordResult.success) {
    return { error: "passwordTooShort" };
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "";

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: "signupFailed" };
  }

  // Record Pro interest in waitlist for future outreach
  if (interest === "pro") {
    await supabase.from("waitlist").upsert(
      { email },
      { onConflict: "email" },
    );
  }

  return { success: "confirmationSent" };
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;

  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    return { error: "invalidEmail" };
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  if (error) {
    return { error: "resetFailed" };
  }

  return { success: "resetSent" };
}
