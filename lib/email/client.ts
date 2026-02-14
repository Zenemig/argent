import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const emailFrom = process.env.EMAIL_FROM ?? "Argent <noreply@argent.photo>";
  const { error } = await getResend().emails.send({
    from: emailFrom,
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("[email] Failed to send:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
