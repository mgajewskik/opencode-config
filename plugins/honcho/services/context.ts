import type { HonchoInjectedContextSections } from "../types.js";

/**
 * Formats Honcho-derived context for injection into an OpenCode prompt.
 */
function formatCardItems(items: string[]): string | null {
  const cleaned = items
    .map((item) => item.trim())
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned.map((item) => `- ${item}`).join("\n") : null;
}

function formatTextSection(title: string, content: string | null | undefined): string | null {
  const trimmed = content?.trim();
  return trimmed ? `${title}:\n${trimmed}` : null;
}

function formatCardSection(title: string, items: string[]): string | null {
  const body = formatCardItems(items);
  return body ? `${title}:\n${body}` : null;
}

export function formatStructuredHonchoContext(
  context: HonchoInjectedContextSections
): string | null {
  const sections = [
    formatCardSection("User Peer Card", context.userPeerCard),
    formatTextSection("User Peer Synthesis", context.userPeerSynthesis),
    formatCardSection("Assistant Peer Card", context.assistantPeerCard),
    formatTextSection("Assistant Peer Synthesis", context.assistantPeerSynthesis),
    formatTextSection("Session Summary", context.sessionSummary),
  ].filter((section): section is string => Boolean(section));

  return sections.length > 0 ? sections.join("\n\n") : null;
}

export function formatHonchoContextForPrompt(
  context: string,
  maxLength: number
): string {
  if (!context || !context.trim()) return "";

  const body =
    context.length > maxLength
      ? context.slice(0, maxLength).trimEnd() + "\n[context truncated]"
      : context;

  return `[HONCHO CONTEXT]
The following context was derived from your Honcho memory system based on the current project and past conversation history. Use it to give more informed and personalised responses.

${body.trim()}

[END HONCHO CONTEXT]`;
}
