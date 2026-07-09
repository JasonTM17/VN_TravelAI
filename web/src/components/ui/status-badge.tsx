import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  confirmed: "text-rice bg-rice/10",
  pending_payment: "text-coral bg-coral/10",
  cancelled: "text-muted bg-border/50",
  draft: "text-ocean bg-ocean/10",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        styles[status] ?? "text-muted bg-border/40",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replaceAll("_", " ")}
    </span>
  );
}
