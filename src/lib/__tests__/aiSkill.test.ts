import { describe, expect, it } from "vitest";
import { buildSkill } from "../aiSkill";

describe("buildSkill", () => {
  it("is a skill for the user's repo with the guide inside", () => {
    const skill = buildSkill("me/notes");
    expect(skill.startsWith("---\nname: glassbox")).toBe(true);
    expect(skill).toContain("me/notes");
    expect(skill).toContain("$ARGUMENTS");
    expect(skill).toContain("# FORMAT");
  });
});
