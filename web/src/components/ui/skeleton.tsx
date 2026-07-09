import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-shimmer rounded-xl bg-border/60", className)} />;
}
