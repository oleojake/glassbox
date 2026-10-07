import { describe, expect, it } from "vitest";
import { backlinks, baseOf, folderOf, parseNote, searchNotes } from "../content";
import { cleanFolderPath } from "../useWorkspace";

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

describe("folders", () => {
  it("splits slugs and cleans folder names", () => {
    expect(folderOf("zod/validation")).toBe("zod");
    expect(folderOf("validation")).toBe("");
    expect(baseOf("zod/deep/validation")).toBe("validation");
    expect(cleanFolderPath(" Zod / Validación  Avanzada ")).toBe("zod/validacion-avanzada");
  });

  it("finds backlinks that use the file name only", () => {
    const target = parseNote("zod/validation", raw("Validation", "x"));
    const other = parseNote("b", raw("B", "See [[validation]]"));
    expect(backlinks([target, other], "zod/validation").map((n) => n.slug)).toEqual(["b"]);
  });
});
