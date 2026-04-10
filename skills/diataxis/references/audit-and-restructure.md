# Audit and Restructure

Primary sources:
- https://diataxis.fr/how-to-use-diataxis/
- https://diataxis.fr/complex-hierarchies/
- https://diataxis.fr/map/

## Use Diátaxis as a guide, not a plan

Do not start by imposing a diagram on the docs.

Do not create empty tutorial / how-to / reference / explanation sections and hope the content will fit later.

Instead:
- pick a real piece of documentation
- assess it critically
- make one improvement that better serves the user need
- publish that improvement
- repeat

Documentation is **never finished, but it can always be complete for its stage**.

## Audit workflow

### 1. Choose the smallest unit that changes the decision

Start as small as possible:
- sentence
- paragraph
- section
- page
- landing page / hierarchy

### 2. Classify with the compass

For each unit ask:
- action or cognition?
- study or work?

Mark:
- dominant quadrant
- contaminating quadrant content
- uncertainty

### 3. Decide the smallest useful move

Common moves:
- **trim**: delete content that does not serve the page’s job
- **split**: separate different quadrants into different pages or sections
- **move**: relocate content into the quadrant where it belongs
- **rewrite**: keep the content but change its language and structure to fit the target quadrant
- **retitle**: rename the page so the promise matches the real user need
- **link out**: keep the main page clean while preserving access to adjacent material

### 4. Improve one thing now

Prefer a single completed improvement over a perfect migration plan.

Examples:
- remove a theory digression from a tutorial and link to an explanation page
- split command syntax out of a how-to into a reference page
- rename a vague page into a user-goal how-to guide
- turn a feature tour into a real tutorial or a real explanation page

## Reformatting existing documentation

### Overloaded tutorial
Likely fixes:
- keep one lesson path
- remove real-world branches
- move deep rationale to explanation
- move reusable task instructions to how-to guides

### Feature-centric how-to guide
Likely fixes:
- rename around a human goal
- remove tool-motion filler
- add only the branches that matter in reality
- move exhaustive option lists to reference

### Reference page that teaches
Likely fixes:
- strip procedural steps into how-to guides
- keep neutral description, warnings, examples, and structure

### Concept page full of steps
Likely fixes:
- keep reasons, concepts, history, and tradeoffs
- extract steps to tutorial or how-to
- extract raw facts to reference

## Hierarchies and landing pages

Four documentation types do **not** require only one valid hierarchy.

When another organizing axis matters — audience, deployment target, platform, product area — keep Diátaxis as a writing and classification discipline inside that structure.

Rules:
- organize from the user’s point of view
- keep each document’s purpose clear even inside a complex hierarchy
- use landing pages as overviews, not just raw lists
- if a list grows beyond roughly seven items, consider grouping it

Landing pages should introduce what follows, not just dump links.

## Output shape for audits

Return:
- current dominant quadrant
- mixed signals or contaminating content
- smallest next restructuring move
- target quadrant after the move
- what to leave alone for now

## Anti-patterns

- planning a full-site migration before fixing any page
- rewriting everything instead of making the smallest clean split
- treating hierarchy debates as more important than user need
- preserving mixed pages because they feel convenient to the writer
