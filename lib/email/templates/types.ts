export type EmailLocale = "en" | "es";

export interface ConfirmEmailProps {
  confirmation_url: string;
  locale: EmailLocale;
}

export interface ResetPasswordProps {
  confirmation_url: string;
  locale: EmailLocale;
}

export interface MagicLinkProps {
  confirmation_url: string;
  locale: EmailLocale;
}

export interface WelcomeProps {
  email: string;
  locale: EmailLocale;
}

export interface EmailTemplate<T> {
  subject: string;
  html: string;
  props: T;
}
