# Reference

Primary source: https://diataxis.fr/reference/

## What reference is

Reference is **technical description**.

Its job is to describe the machinery accurately, completely enough for use, and as plainly as possible. The reader consults it while working.

Reference serves readers who are **at work** and need trustworthy facts.

## Core principles

- Describe and only describe.
- Stay neutral, objective, and factual.
- Follow standard patterns so readers know where to look.
- Mirror the structure of the machinery where possible.
- Use examples only to illustrate, not to teach or explain.
- Include warnings where needed.

Reference should be **austere**. It is usually consulted, not read for pleasure.

## What belongs well in reference

- APIs, classes, methods, fields
- command syntax and flags
- configuration keys and allowed values
- schemas, tables, limits, defaults
- warnings, constraints, error conditions
- precise examples that clarify usage without becoming tutorials

## Language patterns

Prefer:
- factual declarative statements
- lists, tables, field definitions, signatures
- `You must…` / `You must not…` when constraints need explicit statement

Avoid:
- extended rationale that belongs in explanation
- step-by-step directions aimed at accomplishing a task
- narrative teaching voice

## Reference checklist

Pass when most are true:
- the page reads as a reliable source of facts
- the structure mirrors the product or system being described
- readers can scan for known items quickly
- terminology is consistent and patterned
- examples clarify rather than carry the whole teaching burden

Warning signs:
- the page tells the reader how to accomplish a broader goal
- the page spends time arguing for choices or giving history
- the structure follows a user journey more than the machinery
- the page mixes specification with extended discussion

## Minimal rewrite moves toward reference form

- strip out task-oriented steps into how-to guides
- move rationale, tradeoffs, and history into explanation
- reorganize headings to match the product structure
- standardize repeated sections and terminology
- keep illustrative examples short and neutral
