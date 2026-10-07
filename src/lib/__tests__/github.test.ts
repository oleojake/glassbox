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

  it("lists only note and project markdown files", async () => {
    const tree = ["notes/a.md", "notes/sub/b.md", "projects/p.md", "README.md", "notes/c.txt"].map((path, i) => ({ path, type: "blob", sha: `s${i}` }));
    const { impl } = fakeFetch(() => ({ body: { tree } }));
    const files = await createGitHubClient("t", impl).listMarkdown(ref, "main");
    expect(files.map((f) => f.path)).toEqual(["notes/a.md", "projects/p.md"]);
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
