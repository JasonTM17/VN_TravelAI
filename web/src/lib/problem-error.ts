/** Parse RFC7807 / problem+json or plain text into a short UI message. */

export function messageFromErrorBody(text: string, status: number): string {
  const trimmed = (text || "").trim();
  if (!trimmed) return `HTTP ${status}`;
  try {
    const json = JSON.parse(trimmed) as {
      title?: string;
      detail?: string | unknown;
      message?: string;
    };
    const title = typeof json.title === "string" ? json.title : "";
    const detail =
      typeof json.detail === "string"
        ? json.detail
        : json.detail != null
          ? JSON.stringify(json.detail)
          : "";
    if (title && detail) return `${title}: ${detail}`;
    if (title) return title;
    if (typeof json.message === "string" && json.message) return json.message;
    if (detail) return detail;
  } catch {
    /* plain text */
  }
  // Cap raw dumps for UI
  return trimmed.length > 280 ? `${trimmed.slice(0, 280)}…` : trimmed;
}
