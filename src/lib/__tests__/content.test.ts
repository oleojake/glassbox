import { describe, expect, it } from "vitest";
import { backlinks, parseNote, searchNotes } from "../content";

const raw = (title: string, body: string) => `---\ntitle: ${title}\nsummary: About ${title}\ntype: concept\ntags: [js]\n---\n${body}\n`;

describe("content", () => {
  it("parses frontmatter and body", () => {
    const note = parseNote("a", raw("Alpha", "Hello"));
    expect(note.title).toBe("Alpha");
    expect(note.tags).toEqual(["js"]);
    expect(note.body).toContain("Hello");
  });

  it("searches and finds backlinks", () => {
    const a = parseNote("a", raw("Alpha", "See [[b]]"));
    const b = parseNote("b", raw("Beta", "text"));
    expect(searchNotes([a, b], "beta").map((n) => n.slug)).toEqual(["b"]);
    expect(backlinks([a, b], "b").map((n) => n.slug)).toEqual(["a"]);
  });
});

describe("note types", () => {
  it("accepts any label and normalises it", () => {
    expect(parseNote("a", raw("A", "x").replace("type: concept", "type: Meeting")).type).toBe("meeting");
  });
});
