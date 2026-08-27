"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { SourceCard } from "@/components/SourceCard";
import { ResearchReportT } from "@/lib/types";
import { API_BASE } from "@/lib/api";

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

export function ReportView({
  report,
  runId,
}: {
  report: ResearchReportT;
  runId: string | null;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{report.question}</CardTitle>
          </div>
          {runId && (
            <Button variant="outline" size="sm" onClick={() => downloadMarkdown(runId)}>
              Download .md
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {report.executive_summary}
          </p>
        </CardContent>
      </Card>

      {report.sections.map((section, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base">{section.heading}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.claims.map((claim, j) => (
              <div key={j} className="space-y-1.5">
                <p className="text-sm">{claim.text}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <ConfidenceBadge confidence={claim.confidence} />
                  {claim.supporting_sources.map((url) => (
                    <Badge key={url} variant="secondary" className="max-w-48 truncate">
                      <a href={url} target="_blank" rel="noreferrer noopener">
                        {new URL(url).hostname}
                      </a>
                    </Badge>
                  ))}
                </div>
                {claim.note && (
                  <p className="text-xs italic text-muted-foreground">{claim.note}</p>
                )}
                {j < section.claims.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sources ({report.sources.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {report.sources.map((source, i) => (
            <SourceCard key={i} source={source} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
