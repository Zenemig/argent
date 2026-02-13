"use client";

interface LiveRegionProps {
  politeness?: "polite" | "assertive";
  atomic?: boolean;
  children: React.ReactNode;
}

export function LiveRegion({
  politeness = "polite",
  atomic = true,
  children,
}: LiveRegionProps) {
  return (
    <span
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </span>
  );
}
