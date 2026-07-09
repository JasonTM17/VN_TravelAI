import { formatVnd } from "@/lib/utils";

export function PriceTag({
  amount,
  prefix,
  suffix,
  locale = "vi",
}: {
  amount: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
}) {
  return (
    <div className="text-right">
      {prefix ? <div className="text-xs text-muted">{prefix}</div> : null}
      <div className="text-lg font-semibold text-ocean">{formatVnd(amount, locale === "en" ? "en-US" : "vi-VN")}</div>
      {suffix ? <div className="text-xs text-muted">{suffix}</div> : null}
    </div>
  );
}
