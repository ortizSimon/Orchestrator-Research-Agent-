import { SearchResultT } from "@/lib/types";

export function SourceCard({ source }: { source: SearchResultT }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer noopener"
      className="block rounded-md border p-3 text-sm transition-colors hover:bg-muted/50"
    >
      <div className="font-medium">{source.title}</div>
      <div className="truncate text-xs text-muted-foreground">{source.url}</div>
      {source.published_date && (
        <div className="mt-1 text-xs text-muted-foreground">{source.published_date}</div>
      )}
    </a>
  );
}
