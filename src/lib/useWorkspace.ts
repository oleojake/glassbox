import { useCallback, useEffect, useMemo, useState } from "react";
import { demoProjects, parseNote, parseProject, type Note, type Project } from "./content";
import type { Scope } from "./router";
import { clearConnection, loadConnection, type Connection } from "./connection";
import { createGitHubClient, GitHubError, parseRepo, type RepoRef } from "./github";
import { NEW_NOTE_TEMPLATE, useNotes } from "./useNotes";

export type WorkspaceStatus = "ready" | "loading" | "error";

const slugOf = (path: string) => path.split("/").pop()!.replace(/\.md$/, "");

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

interface Remote {
  status: WorkspaceStatus;
  error?: string;
  notes: Note[];
  projects: Project[];
  /** Blob sha of every file on the branch, needed to update it. */
  shas: Record<string, string>;
  branch: string;
}

const EMPTY: Remote = { status: "loading", notes: [], projects: [], shas: {}, branch: "main" };

/**
 * One interface for both modes: the browser-only demo, or the notes repo the visitor connected.
 * In connected mode every save is a commit on the repository's default branch.
 */
export function useWorkspace(scope: Scope) {
  const demo = useNotes();
  const [stored, setConnection] = useState<Connection | null>(loadConnection);
  // The demo route never touches the connected repo, so the two can't be confused.
  const connection = scope === "mine" ? stored : null;
  const [remote, setRemote] = useState<Remote>(EMPTY);
  const [reloadKey, setReloadKey] = useState(0);

  const ref = useMemo<RepoRef | null>(() => (connection ? parseRepo(connection.repo) : null), [connection]);
  const client = useMemo(() => (connection ? createGitHubClient(connection.token) : null), [connection]);

  useEffect(() => {
    if (!client || !ref) return;
    let cancelled = false;
    setRemote(EMPTY);
    (async () => {
      try {
        const info = await client.getRepo(ref);
        const files = await client.listMarkdown(ref, info.defaultBranch);
        const contents = await mapLimit(files, 6, (f) => client.readBlob(ref, f.sha));
        const notes: Note[] = [];
        const projects: Project[] = [];
        const shas: Record<string, string> = {};
        files.forEach((f, i) => {
          shas[f.path] = f.sha;
          if (f.path.startsWith("notes/")) notes.push(parseNote(slugOf(f.path), contents[i]));
          else projects.push(parseProject(slugOf(f.path), contents[i]));
        });
        notes.sort((a, b) => a.title.localeCompare(b.title));
        projects.sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setRemote({ status: "ready", notes, projects, shas, branch: info.defaultBranch });
      } catch (err) {
        const message =
          err instanceof GitHubError && (err.status === 401 || err.status === 403 || err.status === 404)
            ? `${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : String(err);
        if (!cancelled) setRemote({ ...EMPTY, status: "error", error: message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, ref, reloadKey]);

  const saveRemote = useCallback(
    async (slug: string, raw: string) => {
      if (!client || !ref) return;
      const path = `notes/${slug}.md`;
      const sha = remote.shas[path];
      const newSha = await client.writeFile(ref, {
        path,
        content: raw,
        message: `${sha ? "note: update" : "note: add"} ${slug}`,
        branch: remote.branch,
        sha,
      });
      setRemote((prev) => {
        const notes = prev.notes.filter((n) => n.slug !== slug).concat(parseNote(slug, raw));
        notes.sort((a, b) => a.title.localeCompare(b.title));
        return { ...prev, notes, shas: { ...prev.shas, [path]: newSha } };
      });
    },
    [client, ref, remote.shas, remote.branch],
  );

  const createRemote = useCallback((): string => {
    let slug = "untitled-note";
    for (let i = 2; remote.notes.some((n) => n.slug === slug); i++) slug = `untitled-note-${i}`;
    // Kept in memory until the first Save, which creates the file.
    setRemote((prev) => ({ ...prev, notes: prev.notes.concat(parseNote(slug, NEW_NOTE_TEMPLATE)) }));
    return slug;
  }, [remote.notes]);

  const removeRemote = useCallback(
    async (slug: string) => {
      if (!client || !ref) return;
      const path = `notes/${slug}.md`;
      const sha = remote.shas[path];
      // A note that was never saved only exists in memory.
      if (sha) await client.deleteFile(ref, { path, message: `note: delete ${slug}`, branch: remote.branch, sha });
      setRemote((prev) => {
        const { [path]: _gone, ...shas } = prev.shas;
        return { ...prev, notes: prev.notes.filter((n) => n.slug !== slug), shas };
      });
    },
    [client, ref, remote.shas, remote.branch],
  );

  const createProjectRemote = useCallback(
    async (name: string): Promise<string> => {
      if (!client || !ref) return "";
      const base = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
      let slug = base;
      for (let i = 2; remote.projects.some((p) => p.slug === slug); i++) slug = `${base}-${i}`;
      const raw = `---\nname: ${JSON.stringify(name)}\ndescription: What this project is.\nstatus: active\nstack: []\n---\n`;
      const path = `projects/${slug}.md`;
      const newSha = await client.writeFile(ref, { path, content: raw, message: `project: add ${slug}`, branch: remote.branch });
      setRemote((prev) => ({
        ...prev,
        projects: prev.projects.concat(parseProject(slug, raw)).sort((a, b) => a.name.localeCompare(b.name)),
        shas: { ...prev.shas, [path]: newSha },
      }));
      return slug;
    },
    [client, ref, remote.projects, remote.branch],
  );

  const disconnect = useCallback(() => {
    clearConnection();
    setConnection(null);
  }, []);

  if (scope === "mine") {
    return {
      mode: "connected" as const,
      connected: connection !== null,
      repo: connection?.repo,
      status: remote.status,
      error: remote.error,
      notes: remote.notes,
      projects: remote.projects,
      save: saveRemote,
      create: createRemote,
      remove: removeRemote,
      createProject: createProjectRemote,
      reset: disconnect,
      reload: () => setReloadKey((k) => k + 1),
      hasChanges: false,
    };
  }
  return {
    mode: "demo" as const,
    connected: stored !== null,
    repo: undefined,
    status: "ready" as WorkspaceStatus,
    error: undefined,
    notes: demo.notes,
    projects: demoProjects,
    save: async (slug: string, raw: string) => demo.save(slug, raw),
    create: demo.create,
    remove: undefined,
    createProject: undefined,
    reset: demo.reset,
    reload: () => undefined,
    hasChanges: demo.hasChanges,
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
