import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(date) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleString();
}

export function stressColor(level) {
  const map = {
    low: "bg-emerald-500",
    moderate: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-destructive",
  };
  return map[level] || "bg-muted";
}

export function stressTextColor(level) {
  const map = {
    low: "text-emerald-500",
    moderate: "text-amber-500",
    high: "text-orange-500",
    critical: "text-destructive",
  };
  return map[level] || "text-muted-foreground";
}
