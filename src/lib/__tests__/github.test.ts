import { describe, expect, it } from "vitest";
import { GitHubError, createGitHubClient, decodeBase64Utf8, encodeBase64Utf8, parseRepo } from "../github";

const ref = { owner: "me", repo: "notes" };

function fakeFetch(handler: (url: string, init?: RequestInit) => { status?: number; body: unknown }) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const impl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const { status = 200, body } = handler(url, init);
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe("parseRepo", () => {
  it("accepts owner/name and github urls", () => {
    expect(parseRepo("me/notes")).toEqual(ref);
    expect(parseRepo("https://github.com/me/notes.git")).toEqual(ref);
    expect(parseRepo("nonsense")).toBeNull();
  });
});

describe("base64", () => {
  it("round-trips UTF-8", () => {
    const text = "Apuntes: ñandú, 日本語, 🙂";
    expect(decodeBase64Utf8(encodeBase64Utf8(text))).toBe(text);
  });
});

describe("client", () => {
  it("sends the token and reads repo info", async () => {
    const { impl, calls } = fakeFetch(() => ({ body: { private: true, default_branch: "main", permissions: { push: true } } }));
    const info = await createGitHubClient("tok", impl).getRepo(ref);
    expect(info).toEqual({ private: true, canPush: true, defaultBranch: "main" });
    expect((calls[0].init!.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("lists note and project markdown files, notes at any depth", async () => {
    const tree = ["notes/a.md", "notes/sub/b.md", "projects/p.md", "README.md", "notes/c.txt"].map((path, i) => ({ path, type: "blob", sha: `s${i}` }));
    const { impl } = fakeFetch(() => ({ body: { tree } }));
    const files = await createGitHubClient("t", impl).listMarkdown(ref, "main");
    expect(files.map((f) => f.path)).toEqual(["notes/a.md", "notes/sub/b.md", "projects/p.md"]);
  });

  it("lists notes in nested folders, folders and .gitkeep files", async () => {
    const tree = [
      { path: "notes", type: "tree", sha: "t0" },
      { path: "notes/zod", type: "tree", sha: "t1" },
      { path: "notes/zod/validation.md", type: "blob", sha: "s1" },
      { path: "notes/zod/deep/more.md", type: "blob", sha: "s2" },
      { path: "notes/empty/.gitkeep", type: "blob", sha: "k1" },
      { path: "notes/empty", type: "tree", sha: "t2" },
      { path: "projects/app.md", type: "blob", sha: "s3" },
      { path: "projects/sub/x.md", type: "blob", sha: "s4" },
    ];
    const { impl } = fakeFetch(() => ({ body: { tree } }));
    const listing = await createGitHubClient("t", impl).listRepo(ref, "main");
    expect(listing.files.map((f) => f.path)).toEqual(["notes/zod/validation.md", "notes/zod/deep/more.md", "projects/app.md"]);
    expect(listing.folders).toEqual(["zod", "empty"]);
    expect(listing.keeps.map((k) => k.path)).toEqual(["notes/empty/.gitkeep"]);
  });

  it("moves files in one commit through the git data API", async () => {
    const { impl, calls } = fakeFetch((url) => {
      if (url.includes("/git/ref/heads/main")) return { body: { object: { sha: "head" } } };
      if (url.endsWith("/git/commits/head")) return { body: { tree: { sha: "base" } } };
      if (url.endsWith("/git/trees")) return { body: { sha: "newtree" } };
      if (url.endsWith("/git/commits")) return { body: { sha: "newcommit" } };
      return { body: {} };
    });
    await createGitHubClient("t", impl).commitChanges(ref, {
      branch: "main",
      message: "note: move a to z/a",
      changes: [{ path: "notes/z/a.md", sha: "blob" }, { path: "notes/a.md", sha: null }],
    });
    const tree = JSON.parse(calls.find((c) => c.url.endsWith("/git/trees"))!.init!.body as string);
    expect(tree.base_tree).toBe("base");
    expect(tree.tree).toEqual([
      { path: "notes/z/a.md", mode: "100644", type: "blob", sha: "blob" },
      { path: "notes/a.md", mode: "100644", type: "blob", sha: null },
    ]);
    const last = calls[calls.length - 1];
    expect(last.init!.method).toBe("PATCH");
    expect(JSON.parse(last.init!.body as string)).toEqual({ sha: "newcommit" });
  });

  it("treats an empty repository as no notes", async () => {
    const { impl } = fakeFetch(() => ({ status: 409, body: { message: "Git Repository is empty." } }));
    expect(await createGitHubClient("t", impl).listMarkdown(ref, "main")).toEqual([]);
  });

  it("writes a file as a commit", async () => {
    const { impl, calls } = fakeFetch(() => ({ body: { content: { sha: "new" } } }));
    const sha = await createGitHubClient("t", impl).writeFile(ref, { path: "notes/a.md", content: "hola ñ", message: "note: add a", branch: "main", sha: "old" });
    expect(sha).toBe("new");
    expect(calls[0].init!.method).toBe("PUT");
    const body = JSON.parse(calls[0].init!.body as string);
    expect(body).toMatchObject({ message: "note: add a", branch: "main", sha: "old" });
    expect(decodeBase64Utf8(body.content)).toBe("hola ñ");
  });

  it("deletes a file as a commit", async () => {
    const { impl, calls } = fakeFetch(() => ({ body: {} }));
    await createGitHubClient("t", impl).deleteFile(ref, { path: "notes/a.md", message: "note: delete a", branch: "main", sha: "old" });
    expect(calls[0].init!.method).toBe("DELETE");
    expect(JSON.parse(calls[0].init!.body as string)).toEqual({ message: "note: delete a", branch: "main", sha: "old" });
  });

  it("surfaces API errors with their status", async () => {
    const { impl } = fakeFetch(() => ({ status: 409, body: { message: "conflict" } }));
    await expect(createGitHubClient("t", impl).writeFile(ref, { path: "notes/a.md", content: "x", message: "m", branch: "main" })).rejects.toMatchObject({ status: 409 });
    expect(new GitHubError(401, "x").name).toBe("GitHubError");
  });
});
