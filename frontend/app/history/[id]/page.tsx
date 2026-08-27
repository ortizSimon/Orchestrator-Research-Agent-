import { notFound } from "next/navigation";
import { ReportView } from "@/components/ReportView";
import { API_BASE } from "@/lib/api";
import { ResearchReportT } from "@/lib/types";

async function getRun(id: string): Promise<{ report: ResearchReportT } | null> {
  const res = await fetch(`${API_BASE}/api/research/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function HistoryDetailPage(props: PageProps<"/history/[id]">) {
  const { id } = await props.params;
  const run = await getRun(id);

  if (!run) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <ReportView report={run.report} runId={id} />
    </div>
  );
}
