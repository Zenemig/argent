"use client";

import { Link } from "@/i18n/navigation";
import { track } from "@vercel/analytics";
import type { ComponentProps } from "react";

interface CtaLinkProps extends ComponentProps<typeof Link> {
  trackName: string;
}

export function CtaLink({ trackName, onClick, ...props }: CtaLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(trackName);
        onClick?.(e);
      }}
    />
  );
}
