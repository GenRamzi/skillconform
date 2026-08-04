import assert from "node:assert/strict";
import test from "node:test";
import { parseSkill } from "../src/frontmatter.js";

test("parses valid YAML frontmatter", () => {
  const parsed = parseSkill("SKILL.md", "---\nname: example\ndescription: Example skill for testing.\n---\n\nDo the work.\n");
  assert.equal(parsed.parseErrors.length, 0);
  assert.equal(parsed.frontmatter?.name, "example");
  assert.match(parsed.body, /Do the work/);
});

test("reports a missing frontmatter delimiter", () => {
  const parsed = parseSkill("SKILL.md", "name: example\n");
  assert.equal(parsed.frontmatter, null);
  assert.match(parsed.parseErrors[0] ?? "", /must start/);
});

test("reports malformed YAML", () => {
  const parsed = parseSkill("SKILL.md", "---\nname: [broken\n---\nbody\n");
  assert.equal(parsed.frontmatter, null);
  assert.ok(parsed.parseErrors.length > 0);
});
