import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("login") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string; interest?: string }>;
}) {
  const { next, mode, interest } = await searchParams;

  return (
    <LoginForm
      defaultMode={mode === "signup" ? "signup" : "login"}
      next={next}
      interest={interest}
    />
  );
}
