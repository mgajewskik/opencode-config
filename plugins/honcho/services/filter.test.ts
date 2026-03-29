// @ts-nocheck
import { describe, expect, it } from "bun:test";
import { filterContent } from "./filter.js";

const baseConfig = {
  stripCodeBlocks: true,
  maxCodeBlockLines: 10,
  maxLineLength: 40,
  maxContentLength: 400,
  minContentLength: 5,
};

describe("filterContent", () => {
  it("removes only long fenced code blocks while keeping inline code and short snippets", () => {
    const input = [
      "\u001b[32mIntro\u001b[0m",
      "```ts",
      ...Array.from({ length: 11 }, (_, i) => `const line${i + 1} = ${i + 1}`),
      "```",
      "```ts",
      "const keep = true",
      "```",
      "Command `pwd` failed",
      "2026-03-28T10:00:00 request started",
      "    at doThing (/tmp/file.ts:1:1)",
      "Keep this line",
    ].join("\n");

    const result = filterContent(input, baseConfig);

    expect(result.reason).toBeUndefined();
    expect(result.filtered).toContain("Intro");
    expect(result.filtered).toContain("Keep this line");
    expect(result.filtered).not.toContain("const line11 = 11");
    expect(result.filtered).toContain("```ts\nconst keep = true\n```");
    expect(result.filtered).toContain("`pwd`");
    expect(result.filtered).not.toContain("2026-03-28T10:00:00");
    expect(result.filtered).not.toContain("at doThing");
    expect(result.filtered).not.toContain("\u001b[32m");
  });

  it("drops oversized lines and truncates long content with a marker", () => {
    const truncatingConfig = {
      ...baseConfig,
      maxContentLength: 60,
    };

    const input = [
      "one two three",
      "x".repeat(45),
      "four five six",
      "seven eight nine",
      "ten eleven twelve",
      "thirteen fourteen fifteen",
    ].join("\n");

    const result = filterContent(input, truncatingConfig);

    expect(result.filtered).toEndWith("[truncated]");
    expect(result.filtered).toContain("one two three");
    expect(result.filtered).not.toContain("x".repeat(45));
  });

  it("returns fully_stripped when removable content leaves nothing meaningful", () => {
    const input = [
      "```json",
      ...Array.from({ length: 11 }, () => '{"noise":true}'),
      "```",
      "2026-03-28T10:00:00 request started",
      "    at doThing (/tmp/file.ts:1:1)",
    ].join("\n");

    expect(filterContent(input, baseConfig)).toEqual({
      filtered: null,
      reason: "fully_stripped",
    });
  });

  it("returns too_short when the remaining text is below the minimum length", () => {
    expect(
      filterContent("tiny", {
        ...baseConfig,
        minContentLength: 10,
      }),
    ).toEqual({ filtered: null, reason: "too_short" });
  });
});
