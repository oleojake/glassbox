# Working on Glassbox

Rules from the repository owner (Pablo). Follow them in every session.

- **Commits and PRs are the owner's work.** Author commits as the repository owner and add no attribution trailers (`Co-Authored-By`, `Claude-Session` or similar) to commit messages or PR descriptions.
- **No traces of AI tooling in the repository or on GitHub.** Commit messages, PR descriptions, branch names and file contents must not mention the assistant or its vendor. `.claude/settings.json` turns off automatic attribution.
- **Git identity.** Before committing, set `user.name` to `Pablo Marzal` and `user.email` to `156575830+oleojake@users.noreply.github.com`, and use `commit.gpgsign=false`, so commits are authored by the owner and no signing key from the tooling appears.
- **Never rewrite `main`.** Do not force-push to it.
- **Small PRs.** The owner reviews every diff before it is merged. Keep each PR focused and mention the file that deserves the most attention.
- **Language:** code, comments, docs and commit messages are in English. The interface is available in English and Spanish (`src/lib/i18n.tsx`); add every new UI string to both dictionaries. Note content (demo notes) stays in English.
- **Demo content is invented.** Never base demo notes on real client or project code.
- **No running costs:** the app is a static site. Do not add paid services or a backend that stores user notes.
- **Be economical:** prefer one pass over many iterations; do not add dependencies without a reason.

## Commands

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
```
