import instructions from "../../docs/INSTRUCTIONS.md?raw";
import format from "../../docs/FORMAT.md?raw";

/** The rules any AI needs to write Glassbox notes: instructions plus the format reference. */
export const GUIDE = `${instructions}\n\n---\n\n# FORMAT\n\n${format}`;

function body(repo: string): string {
  return `The user keeps their notes in the private GitHub repo \`${repo}\`, separate from the code project you are working in. When they ask for Glassbox notes (for example "/glassbox ..." or "write Glassbox notes about ..."), do this:

1. **Understand the request.** If it mentions a commit, a diff, a feature or a part of the code, read the real thing first (\`git show\`, \`git diff\`, the files). Never describe code you have not seen.
2. **Find the current project.** Use the code project you are in: its folder name and \`git remote get-url origin\`.
3. **Get the notes repo:** \`gh repo clone ${repo} "\${TMPDIR:-/tmp}/glassbox-notes"\` (or \`git pull\` if it is already there).
4. **Match the project.** Look in \`projects/\` for a file whose \`repo\` or \`name\` matches the current project. If there is none, create \`projects/<slug>.md\` with the name and the \`repo\` URL. A note about this project's own code or architecture gets \`projects: [<slug>]\`. A general idea (for example "what is a reducer") stays generic, with \`projects: []\`.
5. **Write the note** following the guide below.
6. **Commit** with a message like \`note: add <slug>\` and push to the default branch.
7. **Reply in two lines**: the file you created and what it covers.

${GUIDE}`;
}

/** A "/glassbox" skill for tools that support skills (Claude Code). Installed once, outside the notes repo. */
export function buildSkill(repo: string): string {
  return `---
name: glassbox
description: Write Glassbox notes about code (a feature, a commit, an architecture) and save them to the notes repo ${repo}. Use when the user runs /glassbox or asks to save notes about code.
---

# /glassbox

Request: $ARGUMENTS

${body(repo)}
`;
}

/** The same rules as plain instructions, for any other AI (AGENTS.md, rules files, custom instructions). */
export function buildInstructions(repo: string): string {
  return `# Glassbox notes

${body(repo)}
`;
}
