import { sendEmail } from "./client";
import { accountDeletedTemplate } from "./templates/account-deleted";
import type { EmailLocale } from "./templates/types";

export async function sendAccountDeletedEmail({
  email,
  locale = "en",
}: {
  email: string;
  locale?: EmailLocale;
}) {
  const { subject, html } = accountDeletedTemplate({ email, locale });
  await sendEmail({ to: email, subject, html });
}
