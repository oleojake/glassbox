import { parse as parseYaml } from "yaml";

/** The four suggested types. A note can use any other label, so this is a plain string. */
export const SUGGESTED_TYPES = ["concept", "recipe", "decision", "reference"] as const;
export type NoteType = string;

export interface Note {
  slug: string;
  title: string;
  summary: string;
  type: NoteType;
  tags: string[];
  projects: string[];
  created?: string;
  updated?: string;
  body: string;
  raw: string;
}

export interface Project {
  slug: string;
  name: string;
  description: string;
  status: "active" | "paused" | "archived";
  stack: string[];
  repo?: string;
  color?: string;
  body: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function splitFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = FRONTMATTER.exec(raw);
  if (!match) return { data: {}, body: raw };
  let data: Record<string, unknown> = {};
  try {
    const parsed = parseYaml(match[1]);
    if (parsed && typeof parsed === "object") data = parsed as Record<string, unknown>;
  } catch {
    // Invalid YAML: keep the body readable and treat the metadata as empty.
  }
  return { data, body: match[2] };
}

const asString = (v: unknown, fallback = "") => (v == null ? fallback : String(v));
const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

export function parseNote(slug: string, raw: string): Note {
  const { data, body } = splitFrontmatter(raw);
  return {
    slug,
    title: asString(data.title, slug),
    summary: asString(data.summary),
    type: asString(data.type, "concept").trim().toLowerCase() || "concept",
    tags: asList(data.tags),
    projects: asList(data.projects),
    created: data.created ? asString(data.created).slice(0, 10) : undefined,
    updated: data.updated ? asString(data.updated).slice(0, 10) : undefined,
    body,
    raw,
  };
}

export function parseProject(slug: string, raw: string): Project {
  const { data, body } = splitFrontmatter(raw);
  return {
    slug,
    name: asString(data.name, slug),
    description: asString(data.description),
    status: asString(data.status, "active") as Project["status"],
    stack: asList(data.stack),
    repo: data.repo ? asString(data.repo) : undefined,
    color: data.color ? asString(data.color) : undefined,
    body,
  };
}

const slugOf = (path: string) => path.split("/").pop()!.replace(/\.md$/, "");
/** "../../content/notes/a/b.md" -> "a/b" */
const noteSlugOf = (path: string) => path.slice(path.indexOf("/notes/") + "/notes/".length).replace(/\.md$/, "");

function load<T>(files: Record<string, string>, fn: (slug: string, raw: string) => T, slug = slugOf): T[] {
  return Object.entries(files).map(([path, raw]) => fn(slug(path), raw));
}

/** The project a note belongs to by its location: its first folder, when that is a project slug. */
export const projectOfSlug = (slug: string, projects: Project[]): string | undefined => {
  const first = slug.includes("/") ? slug.slice(0, slug.indexOf("/")) : "";
  return projects.some((p) => p.slug === first) ? first : undefined;
};

/** Adds the project implied by the folder to each note's `projects` (the frontmatter list stays as extra links). */
export function attachProjects(notes: Note[], projects: Project[]): Note[] {
  return notes.map((n) => {
    const own = projectOfSlug(n.slug, projects);
    return own && !n.projects.includes(own) ? { ...n, projects: [own, ...n.projects] } : n;
  });
}

export const demoProjects: Project[] = load(
  import.meta.glob("../../content/projects/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>,
  parseProject,
);

export const demoNotes: Note[] = attachProjects(
  load(
    import.meta.glob("../../content/notes/**/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>,
    parseNote,
    noteSlugOf,
  ),
  demoProjects,
);

export function searchNotes(notes: Note[], query: string): Note[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return notes;
  return notes
    .map((note) => {
      const title = note.title.toLowerCase();
      const meta = `${note.summary} ${note.tags.join(" ")}`.toLowerCase();
      const body = note.body.toLowerCase();
      let score = 0;
      for (const t of terms) {
        const s = (title.includes(t) ? 5 : 0) + (meta.includes(t) ? 3 : 0) + (body.includes(t) ? 1 : 0);
        if (!s) return { note, score: 0 };
        score += s;
      }
      return { note, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.note);
}

/** Folder part of a slug ("zod/validation" -> "zod"), or "" at the root. */
export const folderOf = (slug: string) => (slug.includes("/") ? slug.slice(0, slug.lastIndexOf("/")) : "");
export const baseOf = (slug: string) => slug.slice(slug.lastIndexOf("/") + 1);
const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function backlinks(notes: Note[], slug: string): Note[] {
  // A link may use the full path or just the file name.
  const names = [...new Set([slug, baseOf(slug)])].map(escapeRegExp).join("|");
  const pattern = new RegExp(`\\[\\[(${names})(\\|[^\\]]*)?\\]\\]`);
  return notes.filter((n) => n.slug !== slug && pattern.test(n.body));
}
