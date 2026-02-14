import type { WelcomeProps } from "./types";
import { getMessages } from "./messages";
import { baseLayout, escapeHtml } from "./utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://argent.photo";

export function welcomeTemplate(props: WelcomeProps) {
  const { locale } = props;
  const m = getMessages(locale).welcome;

  const content = `
    <h1>${escapeHtml(m.heading)}</h1>
    <p>${escapeHtml(m.body)}</p>
    <div class="btn-wrap">
      <a href="${escapeHtml(APP_URL)}" class="btn">${escapeHtml(m.cta)}</a>
    </div>
    <hr class="divider">
    <p style="font-size:14px;color:#a1a1aa;margin:0 0 8px;">
      <strong>${escapeHtml(m.features.title)}</strong>
    </p>
    <ul style="margin:0;padding:0 0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.8;">
      <li>${escapeHtml(m.features.gear)}</li>
      <li>${escapeHtml(m.features.roll)}</li>
      <li>${escapeHtml(m.features.export)}</li>
    </ul>`;

  return {
    subject: m.subject,
    html: baseLayout(content, locale),
  };
}
