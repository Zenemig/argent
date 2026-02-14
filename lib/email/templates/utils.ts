import type { EmailLocale } from "./types";
import { getMessages } from "./messages";

/** Escape HTML special characters to prevent XSS in email templates. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Argent logo for emails. Uses hosted image since email clients strip inline SVG. */
export function logoSvg(): string {
  return `<img src="https://argent.photo/icons/logo-email.png" alt="Argent" width="120" height="42" style="display:block;margin:0 auto;">`;
}

/**
 * Base HTML layout for all Argent emails.
 * Zinc color palette matching the app's dark theme.
 */
export function baseLayout(content: string, locale: EmailLocale): string {
  const m = getMessages(locale);

  return `<!DOCTYPE html>
<html lang="${locale}" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Argent</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: dark light; }
    body {
      margin: 0;
      padding: 0;
      background-color: #18181b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .card {
      background-color: #27272a;
      border-radius: 12px;
      padding: 32px;
      border: 1px solid #3f3f46;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 16px;
      color: #fafafa;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 24px;
      color: #a1a1aa;
    }
    .btn {
      display: inline-block;
      background-color: #fafafa;
      color: #18181b !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      padding: 12px 32px;
      border-radius: 8px;
      text-align: center;
    }
    .btn-wrap {
      text-align: center;
      margin: 24px 0;
    }
    .fallback {
      font-size: 13px;
      color: #71717a;
      word-break: break-all;
      margin-top: 24px;
    }
    .fallback a {
      color: #a1a1aa;
    }
    .divider {
      border: none;
      border-top: 1px solid #3f3f46;
      margin: 32px 0;
    }
    .footer {
      text-align: center;
      padding: 24px;
      font-size: 13px;
      color: #52525b;
    }
    .footer a {
      color: #71717a;
      text-decoration: none;
    }

    @media (prefers-color-scheme: light) {
      body { background-color: #fafafa; color: #18181b; }
      .card { background-color: #ffffff; border-color: #e4e4e7; }
      h1 { color: #18181b; }
      p { color: #52525b; }
      .btn { background-color: #18181b; color: #fafafa !important; }
      .fallback { color: #a1a1aa; }
      .fallback a { color: #52525b; }
      .footer { color: #a1a1aa; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      ${logoSvg()}
    </div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p style="margin:0;font-size:13px;color:inherit;">
        Argent &mdash; ${escapeHtml(m.footer.tagline)}
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:inherit;">
        ${escapeHtml(m.footer.unsubscribe)}
      </p>
    </div>
  </div>
</body>
</html>`;
}
