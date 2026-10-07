export interface RepoRef {
  owner: string;
  repo: string;
}

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

/** Accepts "owner/name" or a github.com URL. */
export function parseRepo(input: string): RepoRef | null {
  const text = input.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "").replace(/\/$/, "");
  const match = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})$/.exec(text);
  return match ? { owner: match[1], repo: match[2] } : null;
}

export interface RepoInfo {
  private: boolean;
  canPush: boolean;
  defaultBranch: string;
}

export interface TreeFile {
  path: string;
  sha: string;
}

// Projects are flat; notes may live in any depth of folders under notes/.
const NOTE_PATH = /^(?:notes\/(?:[^/]+\/)*[^/]+\.md|projects\/[^/]+\.md)$/;
const KEEP_PATH = /^notes\/(?:[^/]+\/)*\.gitkeep$/;

export interface RepoListing {
  files: TreeFile[];
  /** Folder paths under notes/ (without the prefix), including empty ones kept with .gitkeep. */
  folders: string[];
  /** .gitkeep files, needed to delete a folder. */
  keeps: TreeFile[];
}

export interface TreeChange {
  path: string;
  /** Blob sha to place at `path`, or null to delete it. */
  sha: string | null;
}

export function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function createGitHubClient(token: string, fetchImpl: typeof fetch = (...args) => fetch(...args)) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetchImpl(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        detail = ((await res.json()) as { message?: string }).message ?? detail;
      } catch {
        // Keep the status text when the body is not JSON.
      }
      throw new GitHubError(res.status, detail);
    }
    return (await res.json()) as T;
  }

  const base = (ref: RepoRef) => `/repos/${ref.owner}/${ref.repo}`;

  return {
    async getRepo(ref: RepoRef): Promise<RepoInfo> {
      const data = await request<{ private: boolean; default_branch: string; permissions?: { push?: boolean } }>(base(ref));
      return { private: data.private, canPush: Boolean(data.permissions?.push), defaultBranch: data.default_branch };
    },

    /** Lists notes (at any folder depth), projects and folders. An empty repository yields an empty listing. */
    async listRepo(ref: RepoRef, branch: string): Promise<RepoListing> {
      try {
        const data = await request<{ tree: { path: string; type: string; sha: string }[] }>(
          `${base(ref)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
        );
        return {
          files: data.tree.filter((e) => e.type === "blob" && NOTE_PATH.test(e.path)).map((e) => ({ path: e.path, sha: e.sha })),
          folders: data.tree.filter((e) => e.type === "tree" && e.path.startsWith("notes/")).map((e) => e.path.slice("notes/".length)),
          keeps: data.tree.filter((e) => e.type === "blob" && KEEP_PATH.test(e.path)).map((e) => ({ path: e.path, sha: e.sha })),
        };
      } catch (err) {
        if (err instanceof GitHubError && (err.status === 404 || err.status === 409)) return { files: [], folders: [], keeps: [] };
        throw err;
      }
    },

    async listMarkdown(ref: RepoRef, branch: string): Promise<TreeFile[]> {
      return (await this.listRepo(ref, branch)).files;
    },

    async readBlob(ref: RepoRef, sha: string): Promise<string> {
      const data = await request<{ content: string; encoding: string }>(`${base(ref)}/git/blobs/${sha}`);
      return data.encoding === "base64" ? decodeBase64Utf8(data.content) : data.content;
    },

    /** Creates or updates a file as one commit. Pass the current `sha` when updating. */
    async writeFile(ref: RepoRef, args: { path: string; content: string; message: string; branch: string; sha?: string }): Promise<string> {
      const data = await request<{ content: { sha: string } }>(`${base(ref)}/contents/${args.path}`, {
        method: "PUT",
        body: JSON.stringify({
          message: args.message,
          content: encodeBase64Utf8(args.content),
          branch: args.branch,
          ...(args.sha ? { sha: args.sha } : {}),
        }),
      });
      return data.content.sha;
    },

    /** Applies several moves and deletions as ONE commit, using the git data API. */
    async commitChanges(ref: RepoRef, args: { branch: string; message: string; changes: TreeChange[] }): Promise<void> {
      const head = await request<{ object: { sha: string } }>(`${base(ref)}/git/ref/heads/${encodeURIComponent(args.branch)}`);
      const commit = await request<{ tree: { sha: string } }>(`${base(ref)}/git/commits/${head.object.sha}`);
      const tree = await request<{ sha: string }>(`${base(ref)}/git/trees`, {
        method: "POST",
        body: JSON.stringify({
          base_tree: commit.tree.sha,
          tree: args.changes.map((c) => ({ path: c.path, mode: "100644", type: "blob", sha: c.sha })),
        }),
      });
      const created = await request<{ sha: string }>(`${base(ref)}/git/commits`, {
        method: "POST",
        body: JSON.stringify({ message: args.message, tree: tree.sha, parents: [head.object.sha] }),
      });
      await request(`${base(ref)}/git/refs/heads/${encodeURIComponent(args.branch)}`, {
        method: "PATCH",
        body: JSON.stringify({ sha: created.sha }),
      });
    },

    /** Deletes a file as one commit. */
    async deleteFile(ref: RepoRef, args: { path: string; message: string; branch: string; sha: string }): Promise<void> {
      await request(`${base(ref)}/contents/${args.path}`, {
        method: "DELETE",
        body: JSON.stringify({ message: args.message, branch: args.branch, sha: args.sha }),
      });
    },
  };
}

export type GitHubClient = ReturnType<typeof createGitHubClient>;
