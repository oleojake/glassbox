import { describe, expect, it } from "vitest";
import { buildInstructions, buildSkill } from "../aiSkill";

describe("buildSkill", () => {
  it("is a skill for the user's repo with the guide inside", () => {
    const skill = buildSkill("me/notes");
    expect(skill.startsWith("---\nname: glassbox")).toBe(true);
    expect(skill).toContain("me/notes");
    expect(skill).toContain("$ARGUMENTS");
    expect(skill).toContain("# FORMAT");
    expect(skill).toContain("git remote get-url origin");
  });

  it("offers the same rules as plain instructions for other AIs", () => {
    const text = buildInstructions("me/notes");
    expect(text.startsWith("# Glassbox notes")).toBe(true);
    expect(text).toContain("me/notes");
    expect(text).not.toContain("$ARGUMENTS");
  });
});
