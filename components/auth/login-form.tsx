"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";
import { LogoIcon } from "@/components/logo";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signIn, signUp, resetPassword } from "@/app/(auth)/actions";

type Mode = "login" | "signup" | "reset";

interface LoginFormProps {
  defaultMode?: Mode;
  next?: string;
  interest?: string;
}

export function LoginForm({ defaultMode = "login", next, interest }: LoginFormProps) {
  const t = useTranslations("auth");
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      let result: { error?: string; success?: string } | undefined;

      if (mode === "login") {
        result = await signIn(formData);
      } else if (mode === "signup") {
        result = await signUp(formData);
      } else {
        result = await resetPassword(formData);
      }

      if (result?.error) {
        toast.error(t(result.error));
      }
      if (result?.success) {
        toast.success(t(result.success));
      }
    });
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoIcon className="h-10 text-zinc-300" />
        <h1 className="text-2xl font-bold">
          {mode === "reset" ? t("resetPassword") : mode === "signup" ? t("signup") : t("login")}
        </h1>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        {interest && <input type="hidden" name="interest" value={interest} />}
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
          />
        </div>

        {mode !== "reset" && (
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              disabled={pending}
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "reset"
            ? t("resetPassword")
            : mode === "signup"
              ? t("createAccount")
              : t("login")}
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm">
        {mode === "login" && (
          <>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMode("reset")}
            >
              {t("forgotPassword")}
            </button>
            <p className="text-muted-foreground">
              {t("dontHaveAccount")}{" "}
              <button
                type="button"
                className="text-foreground font-medium hover:underline"
                onClick={() => setMode("signup")}
              >
                {t("signup")}
              </button>
            </p>
          </>
        )}

        {mode === "signup" && (
          <p className="text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <button
              type="button"
              className="text-foreground font-medium hover:underline"
              onClick={() => setMode("login")}
            >
              {t("login")}
            </button>
          </p>
        )}

        {mode === "reset" && (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMode("login")}
          >
            {t("backToLogin")}
          </button>
        )}
      </div>
    </div>
  );
}
