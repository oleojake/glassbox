# Instructions for AI assistants writing Glassbox notes

You are adding or editing notes in a Glassbox notes repository. Read `FORMAT.md` first; it is the source of truth for the file layout, frontmatter and special blocks.

## When the user asks you to save something as a note

1. **Decide the scope.** One note per idea. If the request covers several ideas, write several notes and link them with `[[slug]]`.
2. **Pick the type.** `concept` (what it is), `recipe` (how to do it, step by step), `decision` (why it was chosen) or `reference` (cheat sheet).
3. **Check for an existing note.** Search `notes/` by title and tags. Update an existing note instead of creating a near-duplicate, and bump `updated`.
4. **Write the note** at `notes/<slug>.md`:
   - Frontmatter with at least `title`, `summary` and `type`.
   - A `[!REMEMBER]` callout right after the title with the core idea in one sentence.
   - A `mermaid` diagram or a `steps` block whenever there is a flow, an order or more than two moving parts.
   - Short, invented code examples with a `title`. Explain the *why* in comments, not the *what*.
   - A `[!WHEN]` callout saying when to use it, and `[!CAUTION]` for common mistakes.
   - A `files` block when the note explains code in a specific project.
5. **Link it to a project** only if the user is talking about one. Add the project slug to `projects`, and create `projects/<slug>.md` if it does not exist yet.
6. **Commit** with a message like `note: add debounce-and-throttle` or `note: update cqrs-handlers`, one commit per note.

## When the note explains code you (the AI) wrote or changed

- Read the actual diff or files before writing; never describe code you have not seen.
- Explain the design, the flow and the trade-offs so the user could rebuild it without you.
- End with one or two `[!REMEMBER]` callouts the user should be able to answer from memory.

## Never

- Never copy secrets, credentials, personal data or client data into a note.
- Never use syntax outside standard Markdown and the blocks in `FORMAT.md`.
- Never rewrite or delete other notes unless the user asked for it.
