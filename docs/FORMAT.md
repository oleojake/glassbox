# Glassbox note format (v0.1)

A note is a plain Markdown file. Everything Glassbox renders in a special way (diagrams, animated steps, review cards) uses syntax that **still reads well on GitHub** without the app. This file is the reference for any person or AI writing notes.

## 1. Notes repository layout

```
my-notes/
  FORMAT.md               # this document
  INSTRUCTIONS.md         # how an AI should write notes
  projects/
    <slug>.md             # one file per project
  notes/
    <slug>.md             # one file per note
  assets/
    <slug>/image.png      # images for each note
```

The file name without `.md` is the **slug**: lowercase, hyphen-separated, ASCII only. It is the id used for links.

## 2. Note frontmatter

```yaml
---
title: Debounce and throttle
summary: Two ways to limit how often a function runs when events fire in rapid bursts.
type: concept             # suggested: concept | recipe | decision | reference (any label works)
tags: [javascript, performance, events]
projects: []              # project slugs; empty = generic note
created: 2026-10-06
updated: 2026-10-06
---
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `summary` | yes | One sentence. Shown in lists and search. |
| `type` | yes | A label for what kind of note it is. Suggested: `concept` (what something is), `recipe` (how to do something step by step), `decision` (why something was chosen), `reference` (cheat sheet). Any other lowercase word works too, for example `meeting` or `bug`. |
| `tags` | no | Lowercase. |
| `projects` | no | A generic note can link to several projects where it is used. |
| `created`, `updated` | no | The app can also infer them from git history. |

## 3. Project frontmatter

```yaml
---
name: Recipe finder
description: Practice project, searches recipes by ingredient.
status: active            # active | paused | archived
stack: [react, typescript, vite]
repo: https://github.com/user/recipe-finder   # optional
color: "#e8a33d"          # optional, used on the project card
---
```

The body of a project file is free-form (context, decisions, links). A project's notes are listed automatically from each note's `projects` field.

## 4. Special blocks

### 4.1 Callouts and review cards

GitHub-style alerts. `NOTE`, `TIP`, `IMPORTANT`, `WARNING` and `CAUTION` render natively on GitHub. Glassbox adds two more:

```markdown
> [!REMEMBER]
> **dispatch** announces that something happened; the **reducer** decides the new state.

> [!WHEN]
> Use it when only the final value matters.
```

Every `[!REMEMBER]` callout becomes a review card in Glassbox.

### 4.2 Diagrams

` ```mermaid ` blocks. GitHub already draws them; Glassbox also animates them (nodes appear in order, and the flow is traced on hover).

### 4.3 Steps

For an implementation order or any sequence. Glassbox renders an animated timeline; GitHub shows readable YAML.

````markdown
```steps
- title: Create the command
  file: src/Application/CreateOrderCommand.php
  detail: Only carries data, no logic.
- title: Create the handler
  file: src/Application/CreateOrderHandler.php
```
````

`file` and `detail` are optional.

### 4.4 Files

A map of the files involved. When the note belongs to a project with a `repo`, each path links to the file on GitHub.

````markdown
```files
src/Controller/OrderController.php — HTTP entry point
src/Application/CreateOrderHandler.php — use case
```
````

### 4.5 Code

Regular fenced blocks with a language. Add a title with `title`:

````markdown
```ts title="useDebounce.ts"
...
```
````

Consecutive code blocks wrapped in `<!-- tabs -->` … `<!-- /tabs -->` are shown as tabs (useful to compare two versions).

### 4.6 Comparison

A normal Markdown table whose first header cell is `vs`. Glassbox renders it as side-by-side cards.

```markdown
| vs | Debounce | Throttle |
|---|---|---|
| Runs | after the burst ends | at most every N ms |
```

### 4.7 Links between notes

`[[slug]]` or `[[slug|label]]`. Glassbox also shows backlinks ("mentioned in").

## 5. Rules for anyone writing notes (people or AI)

- One note, one idea. If it grows too much, split it and link the parts.
- Start with the `summary` and a `[!REMEMBER]` callout with the idea in one sentence.
- Examples must be minimal and invented; never paste a client's real code or data into a generic note.
- Prefer a diagram or steps over a long paragraph.
- Only standard Markdown plus the blocks in this document: if Glassbox disappeared tomorrow, the note must still read well.
