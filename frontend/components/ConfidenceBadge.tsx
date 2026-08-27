import { Badge } from "@/components/ui/badge";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);

  const style =
    confidence >= 0.8
      ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
      : confidence >= 0.5
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "border-red-600/30 bg-red-600/10 text-red-700 dark:text-red-400";

  const label = confidence >= 0.8 ? "High" : confidence >= 0.5 ? "Medium" : "Low";

  return (
    <Badge variant="outline" className={style}>
      {label} confidence · {pct}%
    </Badge>
  );
}
