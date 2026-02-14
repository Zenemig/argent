/**
 * Email template preview tool.
 * Renders all email templates to HTML files and opens them in the browser.
 *
 * Usage: npm run email:dev
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { confirmEmailTemplate } from "./templates/confirm-email";
import { resetPasswordTemplate } from "./templates/reset-password";
import { magicLinkTemplate } from "./templates/magic-link";
import { welcomeTemplate } from "./templates/welcome";
import type { EmailLocale } from "./templates/types";

const outDir = join("/tmp", "argent-emails");
mkdirSync(outDir, { recursive: true });

const locales: EmailLocale[] = ["en", "es"];

const templates = [
  {
    name: "confirm-email",
    render: (locale: EmailLocale) =>
      confirmEmailTemplate({
        confirmation_url:
          "https://argent.photo/auth/confirm?token_hash=preview123&type=email",
        locale,
      }),
  },
  {
    name: "reset-password",
    render: (locale: EmailLocale) =>
      resetPasswordTemplate({
        confirmation_url:
          "https://argent.photo/auth/confirm?token_hash=preview456&type=recovery",
        locale,
      }),
  },
  {
    name: "magic-link",
    render: (locale: EmailLocale) =>
      magicLinkTemplate({
        confirmation_url:
          "https://argent.photo/auth/confirm?token_hash=preview789&type=magiclink",
        locale,
      }),
  },
  {
    name: "welcome",
    render: (locale: EmailLocale) =>
      welcomeTemplate({ email: "photographer@example.com", locale }),
  },
];

console.log(`\nRendering email templates to ${outDir}\n`);

const files: string[] = [];

for (const template of templates) {
  for (const locale of locales) {
    const { subject, html } = template.render(locale);
    const filename = `${template.name}-${locale}.html`;
    const filepath = join(outDir, filename);
    writeFileSync(filepath, html);
    files.push(filepath);
    console.log(`  ${filename}  — "${subject}"`);
  }
}

console.log(`\nOpening first template in browser...\n`);

try {
  // macOS
  execSync(`open "${files[0]}"`);
} catch {
  try {
    // Linux
    execSync(`xdg-open "${files[0]}"`);
  } catch {
    console.log(`Open manually: ${files[0]}`);
  }
}

console.log(`All templates saved to: ${outDir}`);
