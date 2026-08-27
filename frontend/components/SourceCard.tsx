import { ArrowUpRight } from "lucide-react";
import { SearchResultT } from "@/lib/types";
import { hostnameOf, safeHttpUrl } from "@/lib/url";

export function SourceCard({ source }: { source: SearchResultT }) {
  const url = safeHttpUrl(source.url);

  const inner = (
    <>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground/90">{source.title}</p>
        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground/70">
          {hostnameOf(source.url)}
          {source.published_date && ` · ${source.published_date}`}
        </p>
      </div>
      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
    </>
  );

  const className =
    "group flex items-start justify-between gap-2 rounded-xl border border-border bg-background/40 p-3.5 text-sm transition-colors hover:border-primary/40 hover:bg-card/60";

  if (!url) {
    return <div className={className}>{inner}</div>;
  }

  return (
    <a href={url.href} target="_blank" rel="noreferrer noopener" className={className}>
      {inner}
    </a>
  );
}
