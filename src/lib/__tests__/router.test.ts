import { describe, expect, it } from "vitest";
import { noteHref, parseHash } from "../router";

describe("router", () => {
  it("keeps the demo and my notes apart", () => {
    expect(parseHash("#/demo/notes/a")).toEqual({ name: "note", scope: "demo", slug: "a" });
    expect(parseHash("#/app/notes/a")).toEqual({ name: "note", scope: "mine", slug: "a" });
    expect(parseHash("#/app?tag=x")).toMatchObject({ name: "demo", scope: "mine", tag: "x" });
    expect(noteHref("a", "mine")).toBe("#/app/notes/a");
    expect(parseHash("#/")).toEqual({ name: "landing" });
  });
});
