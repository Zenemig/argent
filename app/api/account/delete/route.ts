import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccountDeletedEmail } from "@/lib/email/send-account-deleted";
import type { EmailLocale } from "@/lib/email/templates/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { confirmation } = await request.json();

  if (confirmation !== user.email) {
    return NextResponse.json(
      { error: "confirmationMismatch" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Detect user locale from cookie
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value === "es" ? "es" : "en") as EmailLocale;

  // Send deletion email before deleting (so it actually delivers)
  try {
    await sendAccountDeletedEmail({ email: user.email, locale });
  } catch (e) {
    console.error("[account-delete] Email failed:", e);
  }

  // Clean up storage files
  try {
    const { data: files } = await admin.storage
      .from("reference-images")
      .list(user.id);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from("reference-images").remove(paths);
    }
  } catch (e) {
    console.error("[account-delete] Storage cleanup failed:", e);
  }

  // Delete auth user (CASCADE deletes all DB rows)
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: "deletionFailed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
