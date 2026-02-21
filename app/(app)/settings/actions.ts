"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { trackEventServer } from "@/lib/analytics/track-event.server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function joinWaitlist() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { error: "notAuthenticated" };

  const { error } = await supabase
    .from("waitlist")
    .upsert({ email: user.email }, { onConflict: "email" });

  if (error) return { error: "failed" };

  await trackEventServer(supabase, user.id, "joined_waitlist");

  return { success: true };
}
