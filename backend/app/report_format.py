from app.models.schemas import ResearchReport, VerifiedClaim


def _confidence_label(confidence: float) -> str:
    if confidence >= 0.8:
        return "High"
    if confidence >= 0.5:
        return "Medium"
    return "Low"


def _claim_to_markdown(claim: VerifiedClaim) -> str:
    lines = [f"- {claim.text} *(confidence: {_confidence_label(claim.confidence)})*"]
    if claim.supporting_sources:
        lines.append(f"  - Supported by: {', '.join(claim.supporting_sources)}")
    if claim.contradicting_sources:
        lines.append(f"  - Contradicted by: {', '.join(claim.contradicting_sources)}")
    if claim.note:
        lines.append(f"  - Note: {claim.note}")
    return "\n".join(lines)


def report_to_markdown(report: ResearchReport) -> str:
    parts = [f"# {report.question}", "", "## Executive summary", "", report.executive_summary, ""]

    for section in report.sections:
        parts.append(f"## {section.heading}")
        parts.append("")
        for claim in section.claims:
            parts.append(_claim_to_markdown(claim))
        parts.append("")

    parts.append("## Sources")
    parts.append("")
    for source in report.sources:
        date_suffix = f" ({source.published_date})" if source.published_date else ""
        parts.append(f"- [{source.title}]({source.url}){date_suffix}")

    return "\n".join(parts)
