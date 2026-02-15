import type { EmailLocale } from "./types";

const messages = {
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
    welcome: {
      subject: "Welcome to Argent",
      heading: "Welcome to Argent!",
      body: "Your email has been confirmed. You're all set to start logging your film photography.",
      cta: "Go to Dashboard",
      features: {
        title: "Here's what you can do:",
        gear: "Add your cameras and lenses to your gear bag",
        roll: "Log rolls of film and track each frame",
        export: "Export XMP sidecar files to embed metadata into your scans",
      },
    },
    accountDeleted: {
      subject: "Your Argent account has been deleted",
      heading: "Account Deleted",
      body: "Your Argent account and all associated data have been permanently deleted. This includes your rolls, frames, gear, and any uploaded images.",
      contact:
        "If you didn't request this deletion, please contact support@argent.photo.",
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
    welcome: {
      subject: "Bienvenido a Argent",
      heading: "¡Bienvenido a Argent!",
      body: "Tu correo ha sido confirmado. Ya puedes empezar a registrar tu fotografía analógica.",
      cta: "Ir al Panel",
      features: {
        title: "Esto es lo que puedes hacer:",
        gear: "Añade tus cámaras y lentes a tu equipo",
        roll: "Registra rollos de película y cada fotograma",
        export:
          "Exporta archivos XMP sidecar para incrustar metadatos en tus escaneos",
      },
    },
    accountDeleted: {
      subject: "Tu cuenta de Argent ha sido eliminada",
      heading: "Cuenta Eliminada",
      body: "Tu cuenta de Argent y todos los datos asociados han sido eliminados permanentemente. Esto incluye tus rollos, fotogramas, equipo y cualquier imagen subida.",
      contact:
        "Si no solicitaste esta eliminación, contacta a support@argent.photo.",
    },
    footer: {
      tagline: "El compañero del fotógrafo analógico",
      unsubscribe: "Recibiste este correo porque te registraste en Argent.",
    },
  },
} as const;

export function getMessages(locale: EmailLocale) {
  return messages[locale] ?? messages.en;
}
