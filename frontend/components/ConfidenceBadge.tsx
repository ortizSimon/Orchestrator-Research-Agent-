export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const [color, label] =
    confidence >= 0.8
      ? ["var(--confidence-high)", "High"]
      : confidence >= 0.5
        ? ["var(--confidence-medium)", "Medium"]
        : ["var(--confidence-low)", "Low"];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.7rem]"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label} &middot; {pct}%
    </span>
  );
}
