import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { scanTarget } from "../src/scanner.js";

const fixtures = join(process.cwd(), "test", "fixtures");

test("accepts a conforming skill", () => {
  const result = scanTarget(join(fixtures, "valid-skill"), "audit");
  assert.equal(result.skillCount, 1);
  assert.deepEqual(result.summary, { errors: 0, warnings: 0, notes: 0 });
});

test("reports structural problems", () => {
  const result = scanTarget(join(fixtures, "invalid-skill"), "check");
  const rules = new Set(result.findings.map((item) => item.ruleId));
  assert.ok(rules.has("SC003"));
  assert.ok(rules.has("SC004"));
  assert.ok(rules.has("SC007"));
  assert.ok(rules.has("SC012"));
  assert.ok(rules.has("SC014"));
  assert.ok(rules.has("SC018"));
});

test("detects risky skill content", () => {
  const result = scanTarget(join(fixtures, "risky-skill"), "audit");
  const rules = new Set(result.findings.map((item) => item.ruleId));
  assert.ok(rules.has("SEC001"));
  assert.ok(rules.has("SEC002"));
  assert.ok(rules.has("SEC003"));
  assert.ok(rules.has("SEC004"));
  assert.ok(rules.has("SEC005"));
});

test("reports a target without skills", () => {
  const result = scanTarget(join(fixtures, "does-not-exist"), "check");
  assert.equal(result.findings[0]?.ruleId, "SC000");
});
