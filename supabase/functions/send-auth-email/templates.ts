// Self-contained email templates for the Supabase Edge Function (Deno runtime).
// Mirrors lib/email/templates/* — keep in sync when updating templates.

export type EmailLocale = "en" | "es";

// ---------- messages ----------

export const emailMessages = {
  en: {
    confirmEmail: {
      subject: "Confirm your email",
      heading: "Confirm your email address",
      body: "Thanks for signing up for Argent. Click the button below to confirm your email and start logging your film.",
      cta: "Confirm Email",
      fallback:
        "If the button doesn't work, copy and paste this link into your browser:",
    },
    resetPassword: {
      subject: "Reset your password",
      heading: "Reset your password",
      body: "We received a request to reset your password. Click the button below to choose a new one.",
      cta: "Reset Password",
      fallback:
        "If the button doesn't work, copy and paste this link into your browser:",
      ignore:
        "If you didn't request a password reset, you can safely ignore this email.",
    },
    magicLink: {
      subject: "Your login link",
      heading: "Your login link",
      body: "Click the button below to sign in to Argent. This link expires in 1 hour.",
      cta: "Sign In",
      fallback:
        "If the button doesn't work, copy and paste this link into your browser:",
    },
    footer: {
      tagline: "The film photographer's companion",
      unsubscribe:
        "You received this email because you signed up for Argent.",
    },
  },
  es: {
    confirmEmail: {
      subject: "Confirma tu correo electrónico",
      heading: "Confirma tu dirección de correo",
      body: "Gracias por registrarte en Argent. Haz clic en el botón de abajo para confirmar tu correo y empezar a registrar tu fotografía analógica.",
      cta: "Confirmar Correo",
      fallback:
        "Si el botón no funciona, copia y pega este enlace en tu navegador:",
    },
    resetPassword: {
      subject: "Restablece tu contraseña",
      heading: "Restablece tu contraseña",
      body: "Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para elegir una nueva.",
      cta: "Restablecer Contraseña",
      fallback:
        "Si el botón no funciona, copia y pega este enlace en tu navegador:",
      ignore:
        "Si no solicitaste un restablecimiento de contraseña, puedes ignorar este correo.",
    },
    magicLink: {
      subject: "Tu enlace de acceso",
      heading: "Tu enlace de acceso",
      body: "Haz clic en el botón de abajo para iniciar sesión en Argent. Este enlace expira en 1 hora.",
      cta: "Iniciar Sesión",
      fallback:
        "Si el botón no funciona, copia y pega este enlace en tu navegador:",
    },
    footer: {
      tagline: "El compañero del fotógrafo analógico",
      unsubscribe: "Recibiste este correo porque te registraste en Argent.",
    },
  },
} as const;

function getMessages(locale: EmailLocale) {
  return emailMessages[locale] ?? emailMessages.en;
}

// ---------- utils ----------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function logoSvg(): string {
  return `<img src="https://argent.photo/icons/logo-email.png" alt="Argent" width="120" height="42" style="display:block;margin:0 auto;">`;
}

function baseLayout(content: string, locale: EmailLocale): string {
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

// ---------- template renderers ----------

function actionContent(
  heading: string,
  body: string,
  cta: string,
  fallback: string,
  url: string,
  extra?: string,
): string {
  return `
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(body)}</p>
    <div class="btn-wrap">
      <a href="${escapeHtml(url)}" class="btn">${escapeHtml(cta)}</a>
    </div>
    <div class="fallback">
      <p style="margin:0;font-size:13px;color:inherit;">
        ${escapeHtml(fallback)}
      </p>
      <p style="margin:4px 0 0;font-size:13px;">
        <a href="${escapeHtml(url)}">${escapeHtml(url)}</a>
      </p>
    </div>${extra ?? ""}`;
}

// ---------- public API ----------

export function renderAuthEmail({
  emailActionType,
  confirmationUrl,
  locale,
}: {
  emailActionType: string;
  confirmationUrl: string;
  locale: EmailLocale;
}): { subject: string; html: string } {
  const m = getMessages(locale);

  switch (emailActionType) {
    case "signup": {
      const msg = m.confirmEmail;
      return {
        subject: msg.subject,
        html: baseLayout(
          actionContent(msg.heading, msg.body, msg.cta, msg.fallback, confirmationUrl),
          locale,
        ),
      };
    }
    case "recovery": {
      const msg = m.resetPassword;
      const extra = `
    <hr class="divider">
    <p style="font-size:13px;color:#71717a;margin:0;">
      ${escapeHtml(msg.ignore)}
    </p>`;
      return {
        subject: msg.subject,
        html: baseLayout(
          actionContent(msg.heading, msg.body, msg.cta, msg.fallback, confirmationUrl, extra),
          locale,
        ),
      };
    }
    case "magiclink": {
      const msg = m.magicLink;
      return {
        subject: msg.subject,
        html: baseLayout(
          actionContent(msg.heading, msg.body, msg.cta, msg.fallback, confirmationUrl),
          locale,
        ),
      };
    }
    default: {
      // Fallback for unknown email types — use confirm email template
      console.warn(`[send-auth-email] Unknown email_action_type: ${emailActionType}, using confirm template`);
      const msg = m.confirmEmail;
      return {
        subject: msg.subject,
        html: baseLayout(
          actionContent(msg.heading, msg.body, msg.cta, msg.fallback, confirmationUrl),
          locale,
        ),
      };
    }
  }
}
