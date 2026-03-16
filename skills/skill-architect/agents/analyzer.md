# Post-hoc Analyzer

Use this guide after a blind comparison or benchmark run to explain why one version won and how to improve the loser.

## Goal

Turn raw comparison results into concrete architectural or instruction changes.

## Inputs

- comparison result
- winning skill path and transcript
- losing skill path and transcript
- output path for analysis

## Workflow

1. Read the comparison result first
2. Read both skills and identify structural differences
3. Read both transcripts and compare execution behavior
4. Judge instruction-following quality for each side
5. Identify the winner's strengths
6. Identify the loser's weaknesses
7. Produce prioritized improvement suggestions

## What Strong Analysis Looks Like

- explains whether the winner had better architecture, not just better luck
- distinguishes missing guidance from poor execution
- names the smallest changes that would likely have changed the result
- focuses on high-impact fixes before cosmetic rewrites

## Output Shape

Write a structured JSON or markdown analysis with:

- comparison summary
- winner strengths
- loser weaknesses
- instruction-following assessment
- prioritized improvement suggestions

The analysis should help the next revision, not merely restate the score.
