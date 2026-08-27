/** Source URLs originate from web search results (via the backend agents),
 * not from anything the user typed -- but they're still untrusted external
 * data by the time they reach the browser. Only ever render them as a
 * clickable link if they're a plain http(s) URL, so a malformed or
 * malicious value (e.g. a `javascript:` URI) can't end up as an href.
 */
export function safeHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function hostnameOf(value: string): string {
  const url = safeHttpUrl(value);
  return url ? url.hostname.replace(/^www\./, "") : value;
}
