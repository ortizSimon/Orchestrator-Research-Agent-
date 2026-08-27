import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Past research runs</h1>

      {runs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No research runs yet — ask a question on the home page to get started.
        </p>
      )}

      <div className="space-y-3">
        {runs.map((run) => (
          <Link key={run.id} href={`/history/${run.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between py-4">
                <span className="font-medium">{run.question}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(run.created_at).toLocaleString()}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
