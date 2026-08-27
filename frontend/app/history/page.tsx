import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { RunSummaryT } from "@/lib/types";

async function getHistory(): Promise<RunSummaryT[]> {
  const res = await fetch(`${API_BASE}/api/research/history`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function HistoryPage() {
  const runs = await getHistory();

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/60">
        Archive
      </p>
      <h1 className="mt-2 font-display text-3xl italic tracking-tight text-foreground">
        Past research runs
      </h1>

      {runs.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          No research runs yet — ask a question on the home page to get started.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-2">
        {runs.map((run) => (
          <Link
            key={run.id}
            href={`/history/${run.id}`}
            className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card/40 px-5 py-4 transition-colors hover:border-primary/40 hover:bg-card/70"
          >
            <span className="truncate text-sm font-medium text-foreground/90">
              {run.question}
            </span>
            <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground/60">
              {new Date(run.created_at).toLocaleDateString()}
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-primary" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
