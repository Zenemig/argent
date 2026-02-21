"use client";

import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminNavProps {
  email: string;
  signOutAction: () => Promise<void>;
}

export function AdminNav({ email, signOutAction }: AdminNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <LogoIcon className="h-6 text-zinc-300" />
            <Badge variant="secondary" className="text-xs">
              Admin
            </Badge>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {email}
          </span>
          <Link href="/">
            <Button variant="ghost" size="sm">
              App
            </Button>
          </Link>
          <form action={signOutAction}>
            <Button variant="ghost" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
