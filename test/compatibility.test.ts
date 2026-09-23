import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { buildCompatibilityMatrix, getCompatibilityProfiles, renderCompatibilityMatrix } from "../src/compatibility.js";

const fixtures = join(process.cwd(), "test", "fixtures");

test("publishes versioned compatibility profiles", () => {
  const profiles = getCompatibilityProfiles();
  assert.deepEqual(
    profiles.map((profile) => profile.id),
    ["agent-skills", "claude-code", "claude-api", "openai-skills", "gemini-cli"],
  );
  assert.ok(profiles.every((profile) => profile.source.startsWith("https://")));
});

test("builds a compatibility matrix for a portable skill", () => {
  const result = buildCompatibilityMatrix(join(fixtures, "valid-skill"));
  assert.equal(result.schemaVersion, "skillconform.compatibility/v1");
  assert.equal(result.skills.length, 1);
  assert.equal(result.skills[0]?.results.length, 5);
  assert.equal(result.skills[0]?.results.find((item) => item.profileId === "agent-skills")?.status, "pass");
});

test("flags detected network use as unsupported for Claude API", () => {
  const result = buildCompatibilityMatrix(join(fixtures, "risky-skill"));
  const claudeApi = result.skills[0]?.results.find((item) => item.profileId === "claude-api");
  assert.equal(claudeApi?.status, "unsupported");
  assert.ok(claudeApi?.checks.some((check) => check.id === "network" && check.status === "unsupported"));
});

test("enforces documented Claude reserved words without applying them to the open standard", () => {
  const result = buildCompatibilityMatrix(join(fixtures, "claude-named-skill"));
  assert.equal(result.skills[0]?.results.find((item) => item.profileId === "agent-skills")?.status, "pass");
  assert.equal(result.skills[0]?.results.find((item) => item.profileId === "claude-code")?.status, "unsupported");
});

test("renders the matrix as JSON", () => {
  const result = buildCompatibilityMatrix(join(fixtures, "valid-skill"));
  const parsed = JSON.parse(renderCompatibilityMatrix(result, "json"));
  assert.equal(parsed.profileSetVersion, "2026-09-23");
});
