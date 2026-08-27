"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Orb } from "@/components/Orb";
import { API_BASE } from "@/lib/api";
import { RunSummaryT } from "@/lib/types";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const NAV = [
  { href: "/", label: "New research" },
  { href: "/history", label: "Archive" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [recent, setRecent] = useState<RunSummaryT[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/research/history`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RunSummaryT[]) => {
        if (!cancelled) setRecent(data.slice(0, 8));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-5 pb-2 pt-6">
        <Orb state="idle" size={26} />
        <span className="font-display text-[1.05rem] italic tracking-tight text-foreground">
          Research Agent
        </span>
      </div>

      <nav className="mt-6 flex flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 font-sans text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/70">
          Recent
        </p>
        <div className="mt-2 flex flex-col gap-0.5">
          {recent.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground/60">
              No runs yet.
            </p>
          )}
          {recent.map((run) => (
            <Link
              key={run.id}
              href={`/history/${run.id}`}
              className="group rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent/60"
            >
              <p className="truncate text-sm text-foreground/85 group-hover:text-foreground">
                {run.question}
              </p>
              <p className="font-mono text-[0.65rem] text-muted-foreground/60">
                {timeAgo(run.created_at)}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="font-mono text-[0.65rem] leading-relaxed text-muted-foreground/50">
          Orchestrator &middot; Search &middot; Verify
          <br />
          Powered by the OpenAI Agents SDK
        </p>
      </div>
    </aside>
  );
}
