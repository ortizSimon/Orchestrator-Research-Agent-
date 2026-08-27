"use client";

import { Download } from "lucide-react";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { SourceCard } from "@/components/SourceCard";
import { ResearchReportT } from "@/lib/types";
import { API_BASE } from "@/lib/api";
import { hostnameOf, safeHttpUrl } from "@/lib/url";

async function downloadMarkdown(runId: string) {
  const res = await fetch(`${API_BASE}/api/research/${runId}/markdown`);
  const text = await res.text();
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "research-report.md";
  a.click();
  URL.revokeObjectURL(url);
}

function confidenceColor(confidence: number): string {
  return confidence >= 0.8
    ? "var(--confidence-high)"
    : confidence >= 0.5
      ? "var(--confidence-medium)"
      : "var(--confidence-low)";
}

export function ReportView({
  report,
  runId,
}: {
  report: ResearchReportT;
  runId: string | null;
}) {
  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-border bg-card/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/60">
            Executive summary
          </p>
          {runId && (
            <button
              onClick={() => downloadMarkdown(runId)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Download className="h-3 w-3" />
              .md
            </button>
          )}
        </div>
        <p className="mt-3 text-[1.05rem] leading-relaxed text-foreground/90">
          {report.executive_summary}
        </p>
      </div>

      {report.sections.map((section, i) => (
        <div key={i}>
          <h2 className="font-display text-xl italic text-foreground">{section.heading}</h2>
          <div className="mt-4 flex flex-col gap-4">
            {section.claims.map((claim, j) => (
              <div
                key={j}
                className="rounded-xl border-l-2 bg-card/30 py-3 pl-4 pr-4"
                style={{ borderColor: confidenceColor(claim.confidence) }}
              >
                <p className="text-[0.95rem] leading-relaxed text-foreground/90">{claim.text}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <ConfidenceBadge confidence={claim.confidence} />
                  {claim.supporting_sources.map((source) => {
                    const url = safeHttpUrl(source);
                    const className =
                      "max-w-40 truncate rounded-full border border-border px-2.5 py-1 font-mono text-[0.7rem] text-muted-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground";
                    return url ? (
                      <a
                        key={source}
                        href={url.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={className}
                      >
                        {hostnameOf(source)}
                      </a>
                    ) : (
                      <span key={source} className={className}>
                        {source}
                      </span>
                    );
                  })}
                </div>
                {claim.note && (
                  <p className="mt-2 text-xs italic text-muted-foreground/60">{claim.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/60">
          Sources &middot; {report.sources.length}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {report.sources.map((source, i) => (
            <SourceCard key={i} source={source} />
          ))}
        </div>
      </div>
    </div>
  );
}
