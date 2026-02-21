import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOut } from "@/app/(app)/settings/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  // Check admin flag via service role (bypasses RLS)
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminNav email={user.email ?? ""} signOutAction={signOut} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
