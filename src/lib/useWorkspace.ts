import { useCallback, useEffect, useMemo, useState } from "react";
import { demoProjects, parseNote, parseProject, type Note, type Project } from "./content";
import type { Scope } from "./router";
import { clearConnection, loadConnection, type Connection } from "./connection";
import { createGitHubClient, GitHubError, parseRepo, type RepoRef } from "./github";
import { NEW_NOTE_TEMPLATE, useNotes } from "./useNotes";

export type WorkspaceStatus = "ready" | "loading" | "error";

/** notes/zod/validation.md -> "zod/validation"; projects/app.md -> "app". */
const slugOf = (path: string) => (path.startsWith("notes/") ? path.slice("notes/".length) : path.split("/").pop()!).replace(/\.md$/, "");

/** Lowercase, ASCII, hyphen-separated segments joined by "/". */
export function cleanFolderPath(input: string): string {
  return input
    .split("/")
    .map((seg) => seg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .filter(Boolean)
    .join("/");
}

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
  /** Every folder under notes/, including empty ones. */
  folders: string[];
  branch: string;
}

const EMPTY: Remote = { status: "loading", notes: [], projects: [], shas: {}, folders: [], branch: "main" };

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
        const { files, folders, keeps } = await client.listRepo(ref, info.defaultBranch);
        const contents = await mapLimit(files, 6, (f) => client.readBlob(ref, f.sha));
        const notes: Note[] = [];
        const projects: Project[] = [];
        const shas: Record<string, string> = {};
        keeps.forEach((k) => (shas[k.path] = k.sha));
        files.forEach((f, i) => {
          shas[f.path] = f.sha;
          if (f.path.startsWith("notes/")) notes.push(parseNote(slugOf(f.path), contents[i]));
          else projects.push(parseProject(slugOf(f.path), contents[i]));
        });
        notes.sort((a, b) => a.title.localeCompare(b.title));
        projects.sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setRemote({ status: "ready", notes, projects, shas, folders, branch: info.defaultBranch });
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

  const createRemote = useCallback((folder = ""): string => {
    const prefix = folder ? `${folder}/` : "";
    let slug = `${prefix}untitled-note`;
    for (let i = 2; remote.notes.some((n) => n.slug === slug); i++) slug = `${prefix}untitled-note-${i}`;
    // Kept in memory until the first Save, which creates the file.
    setRemote((prev) => ({ ...prev, notes: prev.notes.concat(parseNote(slug, NEW_NOTE_TEMPLATE)) }));
    return slug;
  }, [remote.notes]);

  const createFolderRemote = useCallback(
    async (input: string): Promise<string> => {
      const folder = cleanFolderPath(input);
      if (!client || !ref || !folder) return "";
      const path = `notes/${folder}/.gitkeep`;
      const newSha = await client.writeFile(ref, { path, content: "\n", message: `folder: add ${folder}`, branch: remote.branch });
      setRemote((prev) => {
        // Every parent folder exists too.
        const parents = folder.split("/").map((_, i, parts) => parts.slice(0, i + 1).join("/"));
        return { ...prev, folders: [...new Set([...prev.folders, ...parents])].sort(), shas: { ...prev.shas, [path]: newSha } };
      });
      return folder;
    },
    [client, ref, remote.branch],
  );

  /** Moves a note into another folder (empty string = root) and returns its new slug. */
  const moveRemote = useCallback(
    async (slug: string, folder: string): Promise<string> => {
      const name = slug.slice(slug.lastIndexOf("/") + 1);
      const next = folder ? `${folder}/${name}` : name;
      if (next === slug) return slug;
      if (remote.notes.some((n) => n.slug === next)) throw new Error(`${next} already exists`);
      if (!client || !ref) return slug;
      const from = `notes/${slug}.md`;
      const to = `notes/${next}.md`;
      const sha = remote.shas[from];
      // A note that was never saved is only in memory, so moving it needs no commit.
      if (sha) {
        await client.commitChanges(ref, {
          branch: remote.branch,
          message: `note: move ${slug} to ${next}`,
          changes: [{ path: to, sha }, { path: from, sha: null }],
        });
      }
      setRemote((prev) => {
        const { [from]: _old, ...shas } = prev.shas;
        const moved = prev.notes.find((n) => n.slug === slug);
        return {
          ...prev,
          notes: prev.notes.filter((n) => n.slug !== slug).concat(moved ? [parseNote(next, moved.raw)] : []),
          shas: sha ? { ...shas, [to]: sha } : shas,
        };
      });
      return next;
    },
    [client, ref, remote.notes, remote.shas, remote.branch],
  );

  /** Deletes a folder and every note inside it as one commit. */
  const removeFolderRemote = useCallback(
    async (folder: string) => {
      if (!client || !ref) return;
      const prefix = `notes/${folder}/`;
      const doomed = Object.entries(remote.shas).filter(([path]) => path.startsWith(prefix));
      if (doomed.length) {
        await client.commitChanges(ref, {
          branch: remote.branch,
          message: `folder: delete ${folder}`,
          changes: doomed.map(([path]) => ({ path, sha: null })),
        });
      }
      const inside = (slug: string) => slug.startsWith(`${folder}/`);
      setRemote((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => !inside(n.slug)),
        folders: prev.folders.filter((f) => f !== folder && !f.startsWith(`${folder}/`)),
        shas: Object.fromEntries(Object.entries(prev.shas).filter(([path]) => !path.startsWith(prefix))),
      }));
    },
    [client, ref, remote.shas, remote.branch],
  );

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
      folders: remote.folders,
      createFolder: createFolderRemote,
      moveNote: moveRemote,
      removeFolder: removeFolderRemote,
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
    folders: [] as string[],
    createFolder: undefined,
    moveNote: undefined,
    removeFolder: undefined,
    createProject: undefined,
    reset: demo.reset,
    reload: () => undefined,
    hasChanges: demo.hasChanges,
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
