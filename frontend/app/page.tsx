"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Compass, FlaskConical, Microscope } from "lucide-react";
import { AgentActivityFeed } from "@/components/AgentActivityFeed";
import { Orb } from "@/components/Orb";
import { ReportView } from "@/components/ReportView";
import { currentOrbState } from "@/lib/agentState";
import { useResearchStream } from "@/lib/useResearchStream";

const PROMPTS = [
  {
    icon: FlaskConical,
    title: "Fusion energy",
    question: "What are the latest breakthroughs in commercial fusion energy?",
  },
  {
    icon: Compass,
    title: "AI regulation",
    question: "How is AI regulation evolving across major countries right now?",
  },
  {
    icon: Microscope,
    title: "Longevity science",
    question: "What does current research say about extending human lifespan?",
  },
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [greeting, setGreeting] = useState("Welcome");
  const { status, activity, report, runId, error, start, reset } = useResearchStream();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  const isRunning = status === "running";
  const isIdle = status === "idle";

  const launch = (q: string) => {
    if (!q.trim() || isRunning) return;
    start(q.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    launch(question);
  };

  if (isIdle) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16">
        <div className="animate-rise-in">
          <Orb state="idle" size={188} />
        </div>

        <div
          className="max-w-xl text-center animate-rise-in"
          style={{ animationDelay: "0.1s" }}
        >
          <h1 className="font-display text-4xl italic tracking-tight text-foreground sm:text-5xl">
            {greeting}.
          </h1>
          <p className="mt-3 text-balance text-base text-muted-foreground">
            Ask a question. An orchestrator will search the web, summarize what it
            finds, and cross-check every claim before it reaches you.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl animate-rise-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-end gap-2 rounded-[28px] border border-border bg-card/60 p-2.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-colors focus-within:border-primary/40">
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  launch(question);
                }
              }}
              placeholder="What do you want to know?"
              rows={1}
              className="max-h-40 flex-1 resize-none bg-transparent px-3.5 py-2.5 text-[0.95rem] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!question.trim()}
              aria-label="Start research"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div
          className="grid w-full max-w-xl grid-cols-1 gap-3 animate-rise-in sm:grid-cols-3"
          style={{ animationDelay: "0.3s" }}
        >
          {PROMPTS.map(({ icon: Icon, title, question: q }) => (
            <button
              key={title}
              onClick={() => launch(q)}
              className="group rounded-2xl border border-border bg-card/40 p-4 text-left transition-colors hover:border-primary/40 hover:bg-card/70"
            >
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              <p className="mt-2.5 text-sm font-medium text-foreground">{title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{q}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-start gap-4">
        <Orb state={isRunning ? currentOrbState(activity) : "idle"} size={52} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="font-display text-xl italic leading-snug text-foreground">
            {report?.question ?? activity[0]?.question ?? question}
          </p>
        </div>
        <button
          onClick={() => {
            reset();
            setQuestion("");
          }}
          className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          New research
        </button>
      </div>

      {error && (
        <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {(isRunning || (!report && activity.length > 0)) && (
        <AgentActivityFeed activity={activity} isRunning={isRunning} />
      )}

      {report && (
        <div className="mt-8 animate-rise-in">
          <ReportView report={report} runId={runId} />
        </div>
      )}
    </div>
  );
}
