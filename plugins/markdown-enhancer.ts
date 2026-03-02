import type { Hooks, Plugin } from "@opencode-ai/plugin"

type Fence = { marker: "`" | "~"; width: number }

const LANGUAGE_ALIASES: Record<string, string> = {
  csharp: "c#",
  cplusplus: "c++",
  hs: "haskell",
  js: "javascript",
  json5: "json",
  jsonc: "json",
  jsonl: "json",
  md: "markdown",
  py: "python",
  rb: "ruby",
  rs: "rust",
  shell: "bash",
  sh: "bash",
  ts: "typescript",
  tsx: "typescript",
  jsx: "javascript",
  yml: "yaml",
  zsh: "bash",
}

export const MarkdownEnhancer: Plugin = async () => {
  return {
    "experimental.text.complete": async (_input, output) => {
      try {
        output.text = transformMarkdown(output.text)
      } catch {
        output.text = output.text
      }
    },
  } as Hooks
}

function transformMarkdown(text: string): string {
  const lines = text.split("\n")
  const result: string[] = []
  let fence: Fence | null = null
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const fenceStart = parseFence(line)

    if (fenceStart) {
      if (!fence) {
        result.push(normalizeFenceLanguage(line))
        fence = fenceStart
      } else {
        result.push(line)
        if (isClosingFence(line, fence)) fence = null
      }
      index += 1
      continue
    }

    if (fence) {
      result.push(line)
      index += 1
      continue
    }

    result.push(line)
    index += 1
  }

  return result.join("\n")
}

function parseFence(line: string): Fence | null {
  const match = line.match(/^\s*(`{3,}|~{3,})/)
  if (!match) return null

  const sequence = match[1]
  const marker = sequence[0] as Fence["marker"]
  return { marker, width: sequence.length }
}

function isClosingFence(line: string, fence: Fence): boolean {
  const match = line.match(/^\s*(`{3,}|~{3,})\s*$/)
  if (!match) return false

  const sequence = match[1]
  return sequence[0] === fence.marker && sequence.length >= fence.width
}

function normalizeFenceLanguage(line: string): string {
  const match = line.match(/^(\s*)(`{3,}|~{3,})([ \t]*)(.*)$/)
  if (!match) return line

  const [, leading, fence, spaces, info] = match
  if (!info.trim()) return line

  const tokenMatch = info.match(/^([^\s`]+)([\s\S]*)$/)
  if (!tokenMatch) return line

  const [, language, suffix] = tokenMatch
  const normalized = LANGUAGE_ALIASES[language.toLowerCase()] ?? language
  if (normalized === language) return line

  return `${leading}${fence}${spaces}${normalized}${suffix}`
}

export default MarkdownEnhancer
