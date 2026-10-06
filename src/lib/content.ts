import { parse as parseYaml } from "yaml";

export type NoteType = "concept" | "recipe" | "decision" | "reference";

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
    type: (asString(data.type, "concept") as NoteType),
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

function load<T>(files: Record<string, string>, fn: (slug: string, raw: string) => T): T[] {
  return Object.entries(files).map(([path, raw]) => fn(slugOf(path), raw));
}

export const demoNotes: Note[] = load(
  import.meta.glob("../../content/notes/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>,
  parseNote,
);

export const demoProjects: Project[] = load(
  import.meta.glob("../../content/projects/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>,
  parseProject,
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

export function backlinks(notes: Note[], slug: string): Note[] {
  const pattern = new RegExp(`\\[\\[${slug}(\\|[^\\]]*)?\\]\\]`);
  return notes.filter((n) => n.slug !== slug && pattern.test(n.body));
}
