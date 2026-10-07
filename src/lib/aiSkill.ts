import instructions from "../../docs/INSTRUCTIONS.md?raw";
import format from "../../docs/FORMAT.md?raw";

/** The rules any AI needs to write Glassbox notes: instructions plus the format reference. */
export const GUIDE = `${instructions}\n\n---\n\n# FORMAT\n\n${format}`;

/**
 * A personalised "/glassbox" skill. It is installed once in the user's AI tool
 * (not in the notes repo), because the AI works inside the user's code projects
 * and has to reach the separate notes repo from there.
 */
export function buildSkill(repo: string): string {
  return `---
name: glassbox
description: Write a Glassbox note about a feature, commit or concept and save it to the notes repo ${repo}. Use when the user runs /glassbox or asks to save notes about code.
---

# /glassbox

The user keeps their notes in the private GitHub repo \`${repo}\`. Request: $ARGUMENTS

1. Understand the request. If it mentions a commit, a diff or a feature, read the real code first (\`git show\`, \`git diff\`, the files). Never describe code you have not seen.
2. Get the notes repo: \`gh repo clone ${repo} "\${TMPDIR:-/tmp}/glassbox-notes"\` (or \`git pull\` if it is already there).
3. Write the note (and the project file, if needed) following the guide below.
4. Commit with a message like \`note: add <slug>\` and push to the default branch.
5. Tell the user the file you created and what the note covers, in two lines.

---

${GUIDE}
`;
}
