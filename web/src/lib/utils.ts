import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVnd(value: number, locale = "vi-VN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
