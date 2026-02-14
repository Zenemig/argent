import type { MagicLinkProps } from "./types";
import { getMessages } from "./messages";
import { baseLayout, escapeHtml } from "./utils";

export function magicLinkTemplate(props: MagicLinkProps) {
  const { confirmation_url, locale } = props;
  const m = getMessages(locale).magicLink;

  const content = `
    <h1>${escapeHtml(m.heading)}</h1>
    <p>${escapeHtml(m.body)}</p>
    <div class="btn-wrap">
      <a href="${escapeHtml(confirmation_url)}" class="btn">${escapeHtml(m.cta)}</a>
    </div>
    <div class="fallback">
      <p style="margin:0;font-size:13px;color:inherit;">
        ${escapeHtml(m.fallback)}
      </p>
      <p style="margin:4px 0 0;font-size:13px;">
        <a href="${escapeHtml(confirmation_url)}">${escapeHtml(confirmation_url)}</a>
      </p>
    </div>`;

  return {
    subject: m.subject,
    html: baseLayout(content, locale),
  };
}
