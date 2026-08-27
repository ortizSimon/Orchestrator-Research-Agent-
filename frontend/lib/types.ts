export interface SearchResultT {
  title: string;
  url: string;
  snippet: string;
  published_date: string | null;
}

export interface VerifiedClaimT {
  text: string;
  supporting_sources: string[];
  contradicting_sources: string[];
  confidence: number;
  note: string | null;
}

export interface ReportSectionT {
  heading: string;
  claims: VerifiedClaimT[];
}

export interface ResearchReportT {
  question: string;
  executive_summary: string;
  sections: ReportSectionT[];
  sources: SearchResultT[];
}

export interface RunSummaryT {
  id: string;
  question: string;
  created_at: string;
}

export type ActivityEventName =
  | "started"
  | "agent_updated"
  | "tool_started"
  | "tool_finished"
  | "report"
  | "error";

export interface ActivityEvent {
  event: ActivityEventName;
  question?: string;
  agent?: string;
  tool?: string;
  label?: string;
  input?: string | null;
  message?: string;
  report?: ResearchReportT;
  run_id?: string;
}
