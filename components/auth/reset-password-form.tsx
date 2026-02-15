"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogoIcon } from "@/components/logo";
import { PasswordInput } from "@/components/auth/password-input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePassword } from "@/app/(auth)/actions";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) {
        toast.error(t(result.error));
      }
    });
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoIcon className="h-10 text-zinc-300" />
        <h1 className="text-2xl font-bold">{t("resetPassword")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("chooseNewPassword")}
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t("newPassword")}</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={6}
            disabled={pending}
          />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("resetPassword")}
        </Button>
      </form>
    </div>
  );
}
