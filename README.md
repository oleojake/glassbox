# Glassbox

Notes for developers who let AI write code but still want to understand it.

Glassbox turns what you learn into visual notes (diagrams, animated steps, code, comparisons) written as plain Markdown. Notes are meant to live in a GitHub repo you own, so every save is a commit.

> **Status:** early MVP. The landing page and a browser-only demo work today. GitHub sign-in and syncing to your own notes repo are next.

## What is in here

| Path | What it is |
|---|---|
| `src/` | The web app (React + TypeScript + Vite). |
| `content/` | Demo notes and projects shown in the public demo. All invented, none from a real project. |
| `docs/FORMAT.md` | The note format: frontmatter and the special blocks (`steps`, `files`, callouts, tabs, comparisons, diagrams). |
| `docs/INSTRUCTIONS.md` | Instructions you drop in your notes repo so any AI assistant writes notes in the right format. |

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and build to dist/
```

The build is a static site (relative paths, hash routing), so it works on any static host or sub-path.

## How the demo stores data

Nothing is sent to a server. Edits you make in the demo are saved in your browser's `localStorage`, and the demo banner has a reset button.

## Connect your own notes repo

Create a **private** GitHub repository for your notes (see `docs/FORMAT.md` for the layout), then create a fine-grained personal access token limited to that repository with **Contents: Read and write**. Open `#/connect`, paste the repository name and the token. The token stays in your browser (localStorage) and is only sent to `api.github.com`; there is no server. Every save in the app becomes a commit in your repository. Public repositories are refused on purpose.

## License

MIT
