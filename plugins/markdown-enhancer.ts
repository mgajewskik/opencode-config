import type { Hooks, Plugin } from "@opencode-ai/plugin"

declare const Bun: {
  stringWidth(value: string): number
}

type Alignment = "left" | "center" | "right"
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

    const table = collectTable(lines, index)
    if (!table) {
      result.push(line)
      index += 1
      continue
    }

    result.push(...formatTable(table.lines, table.indent))
    index = table.nextIndex
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

function collectTable(
  lines: string[],
  startIndex: number,
): { lines: string[]; indent: string; nextIndex: number } | null {
  const first = parseRow(lines[startIndex])
  const second = parseRow(lines[startIndex + 1])

  if (!first || !second) return null
  if (first.isSeparator || !second.isSeparator) return null
  if (first.cells.length !== second.cells.length) return null

  const indent = first.indent
  const tableLines = [lines[startIndex], lines[startIndex + 1]]
  const colCount = first.cells.length
  let index = startIndex + 2

  while (index < lines.length) {
    const parsed = parseRow(lines[index])
    if (!parsed) break
    if (parsed.cells.length !== colCount) break
    if (parsed.indent !== indent) break
    tableLines.push(lines[index])
    index += 1
  }

  return { lines: tableLines, indent, nextIndex: index }
}

function formatTable(lines: string[], indent: string): string[] {
  const parsedRows = lines
    .map(parseRow)
    .filter((row): row is NonNullable<ReturnType<typeof parseRow>> => !!row)

  if (parsedRows.length === 0) return lines

  const colCount = parsedRows[0].cells.length
  const alignments: Alignment[] = Array(colCount).fill("left")
  const widths: number[] = Array(colCount).fill(3)

  for (const row of parsedRows) {
    if (!row.isSeparator) continue
    for (let col = 0; col < colCount; col += 1) {
      alignments[col] = parseAlignment(row.cells[col] ?? "")
    }
  }

  for (const row of parsedRows) {
    if (row.isSeparator) continue
    for (let col = 0; col < colCount; col += 1) {
      const cell = row.cells[col] ?? ""
      widths[col] = Math.max(widths[col], displayWidth(cell))
    }
  }

  for (let col = 0; col < colCount; col += 1) {
    if (alignments[col] === "center") {
      widths[col] = Math.max(widths[col], 4)
    }
  }

  return parsedRows.map((row) => {
    const cells = row.cells.map((cell, col) => {
      if (row.isSeparator) return formatSeparator(widths[col], alignments[col])
      return padCell(cell, widths[col], alignments[col])
    })
    return `${indent}| ${cells.join(" | ")} |`
  })
}

function parseRow(line?: string): { cells: string[]; indent: string; isSeparator: boolean } | null {
  if (line === undefined) return null
  if (line.trim() === "") return null

  const indentMatch = line.match(/^(\s*)/)
  const indent = indentMatch ? indentMatch[1] : ""
  const trimmed = line.trim()

  if (trimmed.startsWith(">")) return null
  if (!trimmed.includes("|")) return null

  let content = trimmed
  if (content.startsWith("|")) content = content.slice(1)
  if (content.endsWith("|")) content = content.slice(0, -1)

  const cells = content.split(/(?<!\\)\|/).map((cell) => cell.trim())
  if (cells.length < 2) return null

  const isSeparator = cells.every((cell) => /^:?-{2,}:?$/.test(cell))
  return { cells, indent, isSeparator }
}

function parseAlignment(cell: string): Alignment {
  const trimmed = cell.trim()
  const left = trimmed.startsWith(":")
  const right = trimmed.endsWith(":")

  if (left && right) return "center"
  if (right) return "right"
  return "left"
}

function formatSeparator(width: number, alignment: Alignment): string {
  const w = Math.max(3, width)
  if (alignment === "center") return `:${"-".repeat(Math.max(2, w - 2))}:`
  if (alignment === "right") return `${"-".repeat(Math.max(2, w - 1))}:`
  return "-".repeat(w)
}

function padCell(text: string, width: number, alignment: Alignment): string {
  const visible = displayWidth(text)
  const totalPad = Math.max(0, width - visible)

  if (alignment === "center") {
    const left = Math.floor(totalPad / 2)
    const right = totalPad - left
    return `${" ".repeat(left)}${text}${" ".repeat(right)}`
  }

  if (alignment === "right") {
    return `${" ".repeat(totalPad)}${text}`
  }

  return `${text}${" ".repeat(totalPad)}`
}

function displayWidth(text: string): number {
  if (!text) return 0

  const inlineCode: string[] = []
  let value = text.replace(/`([^`]+)`/g, (_match, content: string) => {
    inlineCode.push(content)
    return `\u0000CODE${inlineCode.length - 1}\u0000`
  })

  value = value
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")

  value = value.replace(/\u0000CODE(\d+)\u0000/g, (_match, index: string) => {
    return inlineCode[Number(index)] ?? ""
  })

  return Bun.stringWidth(value)
}

export default MarkdownEnhancer
