import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-8 h-10 text-muted-foreground" />
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/gear">Go home</Link>
      </Button>
    </div>
  );
}
