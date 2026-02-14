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
  return `<svg viewBox="0 0 318 111" fill="none" xmlns="http://www.w3.org/2000/svg" width="120" height="42" role="img" aria-label="Argent"><path fill-rule="evenodd" clip-rule="evenodd" d="M78.3408 77.4336V26.4004H94.0605V31.5859C94.1007 31.5375 94.1402 31.4885 94.1807 31.4404C97.6206 27.2805 102.581 25.2003 109.061 25.2002C111.861 25.2002 114.381 25.6806 116.621 26.6406C118.597 27.4169 120.417 28.6603 122.081 30.3701C122.73 29.9015 123.404 29.4567 124.103 29.04C128.262 26.4802 132.943 25.2002 138.143 25.2002C142.462 25.2003 146.262 26.0408 149.542 27.7207C151.51 28.7045 153.228 29.9094 154.702 31.332V26.4004H170.302V43.9404C170.839 42.562 171.483 41.2348 172.234 39.96C174.954 35.4001 178.635 31.8001 183.274 29.1602C187.914 26.4403 193.074 25.0801 198.754 25.0801C204.354 25.0801 209.275 26.3599 213.515 28.9199C217.835 31.3999 221.195 34.8403 223.595 39.2402C224.134 40.1793 224.614 41.1468 225.036 42.1426V26.4004H240.756V31.8359C242.189 30.3652 243.827 29.1119 245.676 28.0801C249.196 26.1601 253.157 25.2002 257.557 25.2002C261.796 25.2003 265.596 26.2805 268.956 28.4404C271.178 29.816 273.083 31.4905 274.676 33.4609V26.4004H288.236V2.28027H303.956V26.4004H317.516V40.2002H303.956V84.3604H288.236V40.2002H278.482C279.33 42.557 279.756 45.0367 279.756 47.6406V84.3604H264.036V51.1201C264.036 47.6802 262.956 44.8806 260.796 42.7207C258.636 40.5608 255.836 39.4805 252.396 39.4805C250.157 39.4805 248.156 39.9601 246.396 40.9199C244.637 41.8799 243.236 43.2402 242.196 45C241.236 46.7599 240.756 48.8002 240.756 51.1201V84.3604H225.036V60.8438L184.088 60.9443C184.395 62.1398 184.803 63.2654 185.314 64.3203C186.674 66.8803 188.594 68.8803 191.074 70.3203C193.554 71.6803 196.434 72.3603 199.714 72.3604C202.674 72.3604 205.354 71.8799 207.754 70.9199C210.154 69.8799 212.234 68.3603 213.994 66.3604L223.234 75.6006C220.434 78.8805 216.994 81.3601 212.914 83.04C208.914 84.72 204.554 85.5605 199.834 85.5605C193.754 85.5605 188.355 84.2805 183.635 81.7207C178.915 79.0807 175.154 75.4799 172.354 70.9199C171.551 69.5735 170.868 68.1709 170.302 66.7129V81.3604C170.302 87.1204 168.942 92.1204 166.222 96.3604C163.582 100.68 159.902 104.04 155.182 106.44C150.462 108.84 145.022 110.04 138.862 110.04C132.702 110.04 127.262 108.921 122.542 106.681C117.822 104.521 114.062 101.44 111.262 97.4404L121.222 87.4805C123.462 90.1205 125.942 92.1205 128.662 93.4805C131.462 94.9205 134.822 95.6406 138.742 95.6406C143.622 95.6406 147.462 94.3999 150.262 91.9199C153.142 89.44 154.582 86.0005 154.582 81.6006V76.7881C153.108 78.2109 151.39 79.4166 149.422 80.4004C146.142 82.0003 142.382 82.8007 138.143 82.8008C132.943 82.8008 128.262 81.56 124.103 79.0801C119.943 76.5201 116.662 73.0406 114.262 68.6406C111.942 64.2406 110.782 59.3199 110.782 53.8799C110.782 49.6896 111.47 45.8314 112.847 42.3057C111.976 41.3739 110.916 40.6707 109.661 40.2002C108.461 39.7202 107.061 39.4805 105.461 39.4805C102.101 39.4805 99.3407 40.5607 97.1807 42.7207C95.1009 44.8007 94.0606 48.0005 94.0605 52.3203V84.3604H63.7197L57.7803 68.6406H23.0605L17.04 84.3604H0L33.96 0H47.2793L78.3408 77.4336ZM141.262 39.4805C138.382 39.4805 135.862 40.1205 133.702 41.4004C131.542 42.6004 129.862 44.3205 128.662 46.5605C127.462 48.7204 126.862 51.2002 126.862 54C126.862 56.72 127.462 59.2004 128.662 61.4404C129.862 63.6004 131.542 65.3206 133.702 66.6006C135.862 67.8805 138.382 68.5205 141.262 68.5205C144.142 68.5205 146.622 67.9207 148.702 66.7207C150.862 65.4407 152.542 63.7205 153.742 61.5605C154.942 59.3205 155.542 56.8 155.542 54C155.542 51.1202 154.942 48.6003 153.742 46.4404C152.542 44.2804 150.862 42.6004 148.702 41.4004C146.622 40.1204 144.142 39.4805 141.262 39.4805ZM40.6016 18.3604C40.3607 18.3676 40.1059 18.515 40.0137 18.7559C39.6126 19.8019 38.071 21.9953 36.2852 24.5361C32.1954 30.3515 26.5939 38.316 26.5938 43.498C26.5938 51.1416 32.8739 57.3603 40.5938 57.3604C48.3136 57.3604 54.5938 51.1417 54.5938 43.498C54.5936 38.3998 49.0938 30.5756 45.0781 24.8623C43.1975 22.1874 41.5729 19.8767 41.1787 18.7705C41.0916 18.5271 40.8622 18.3637 40.6016 18.3604ZM198.754 38.1602C195.634 38.1602 192.915 38.8805 190.595 40.3203C188.275 41.6803 186.474 43.6403 185.194 46.2002C184.746 47.1269 184.381 48.1209 184.101 49.1816L212.156 49.0996C211.84 47.7236 211.413 46.4769 210.874 45.3604C209.834 43.0404 208.274 41.2801 206.194 40.0801C204.194 38.8001 201.714 38.1602 198.754 38.1602Z" fill="#e4e4e7"/></svg>`;
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
