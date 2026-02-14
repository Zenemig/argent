import { sendEmail } from "./client";
import { welcomeTemplate } from "./templates/welcome";
import type { EmailLocale } from "./templates/types";

export async function sendWelcomeEmail({
  email,
  locale = "en",
}: {
  email: string;
  locale?: EmailLocale;
}) {
  const { subject, html } = welcomeTemplate({ email, locale });
  await sendEmail({ to: email, subject, html });
}
