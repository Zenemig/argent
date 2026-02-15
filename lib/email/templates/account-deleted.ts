import type { AccountDeletedProps } from "./types";
import { getMessages } from "./messages";
import { baseLayout, escapeHtml } from "./utils";

export function accountDeletedTemplate(props: AccountDeletedProps) {
  const { locale } = props;
  const m = getMessages(locale).accountDeleted;

  const content = `
    <h1>${escapeHtml(m.heading)}</h1>
    <p>${escapeHtml(m.body)}</p>
    <hr class="divider">
    <p style="font-size:14px;color:#a1a1aa;margin:0;">
      ${escapeHtml(m.contact)}
    </p>`;

  return {
    subject: m.subject,
    html: baseLayout(content, locale),
  };
}
