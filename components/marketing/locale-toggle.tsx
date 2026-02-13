"use client";

import { useRouter } from "next/navigation";

export function LocaleToggle({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const isEnglish = currentLocale === "en";
  const targetLocale = isEnglish ? "es" : "en";
  const targetPath = isEnglish ? "/es" : "/";

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    document.cookie = `NEXT_LOCALE=${targetLocale};path=/;max-age=31536000;SameSite=Lax`;
    router.push(targetPath);
  }

  return (
    <a
      href={targetPath}
      onClick={handleClick}
      className="text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      {targetLocale.toUpperCase()}
    </a>
  );
}
