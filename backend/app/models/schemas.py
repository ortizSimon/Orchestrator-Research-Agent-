"""Typed contracts passed between agents.

Keeping these as Pydantic models (rather than free text) is what lets
citations and confidence scores survive the pipeline without drifting or
being re-hallucinated at the final synthesis step.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    published_date: str | None = None


class SearchResults(BaseModel):
    sub_query: str
    results: list[SearchResult]


class SourcedClaim(BaseModel):
    text: str
    source_url: str


class SubTopicSummary(BaseModel):
    sub_query: str
    claims: list[SourcedClaim]


class VerifiedClaim(BaseModel):
    text: str
    supporting_sources: list[str] = Field(default_factory=list)
    contradicting_sources: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    note: str | None = None


class VerifiedSubTopic(BaseModel):
    sub_query: str
    claims: list[VerifiedClaim]


class VerificationResult(BaseModel):
    topics: list[VerifiedSubTopic]


class ResearchPlan(BaseModel):
    sub_queries: list[str]


class ReportSection(BaseModel):
    heading: str
    claims: list[VerifiedClaim]


class ResearchReport(BaseModel):
    question: str
    executive_summary: str
    sections: list[ReportSection]
    sources: list[SearchResult]
