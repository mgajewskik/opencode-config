# Distinctions and Failure Modes

Primary sources:
- https://diataxis.fr/tutorials-how-to/
- https://diataxis.fr/reference-explanation/
- https://diataxis.fr/map/

## Tutorial vs how-to guide

This is the most common and most harmful confusion.

| Dimension | Tutorial | How-to guide |
| --- | --- | --- |
| Reader state | at study | at work |
| Purpose | learning experience | task completion |
| Writer responsibility | teacher manages success | guide supports user judgment |
| Path | single managed path | can branch and adapt |
| Environment | controlled and safe | real-world conditions |
| Basic stance | concrete lesson | practical directions |
| Explanation | minimized | minimized |
| Choices and alternatives | usually suppressed | often necessary |

Critical rule:
- **difficulty does not decide the type**
- **beginner vs advanced does not decide the type**

## Reference vs explanation

Both live on the cognition side of the map, so they are easy to blur.

| Dimension | Reference | Explanation |
| --- | --- | --- |
| Reader state | working | studying / reflecting |
| Purpose | trustworthy facts | understanding and context |
| Shape | structured description | discussion |
| Tone | neutral and austere | discursive and interpretive |
| Examples | illustrative | exploratory or comparative |
| Good test | consulted during work | read to understand why |

Useful rule of thumb from the framework:
- if it is mostly lists, tables, signatures, or options, it is probably reference
- if it makes sense to read away from the task, it is probably explanation

## Common failure modes

### 1. Tutorial and how-to collapse into each other
Symptoms:
- a tutorial that expects user judgment and real-world decisions
- a how-to that keeps teaching basics and walking the reader like a novice

Fix:
- decide whether the reader is studying or working
- split learning path from production task guidance

### 2. Explanation inside tutorials or how-to guides
Symptoms:
- long rationale blocks interrupt the action
- reader loses flow while trying to do something

Fix:
- keep the action page minimal
- link out to explanation

### 3. Instructions inside reference
Symptoms:
- a reference page starts telling the reader how to achieve a broader task
- user journeys appear inside API or config descriptions

Fix:
- extract task guidance into how-to guides
- leave only descriptive facts and concise examples

### 4. Explanation absorbs everything
Symptoms:
- concept pages contain setup steps, reference tables, and troubleshooting sequences
- the topic boundary keeps expanding

Fix:
- bound the page with a why-question or topic question
- move steps and specifications out to their proper forms

### 5. Type chosen by topic difficulty
Symptoms:
- `advanced` pages are assumed to be how-to guides
- `beginner` pages are assumed to be tutorials

Fix:
- ignore perceived difficulty
- classify by study/work and action/cognition

### 6. Four boxes mentality
Symptoms:
- empty top-level sections created before content exists
- migration effort stalls on information architecture debates

Fix:
- improve one piece at a time
- let structure emerge from corrected content

## Audit heuristics

If a page contains all of these, it is probably mixed and needs work:
- imperatives plus extended conceptual background
- feature descriptions plus task sequences
- novice hand-holding plus real-world branches
- tables/specification plus subjective argument

## Preferred repair order

1. classify the dominant user need
2. identify the strongest contaminating content from neighboring quadrants
3. remove, split, move, or link out that contaminating content
4. only then polish wording inside the chosen quadrant
