import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { compareSkillTargets, renderRegressionReport, shouldFailRegression } from "../src/regression.js";

const root = join(process.cwd(), "test", "fixtures", "regression");
const baseline = join(root, "base");
const candidate = join(root, "candidate");

test("reports no regression when baseline and candidate are identical", () => {
  const result = compareSkillTargets(baseline, baseline);
  assert.equal(result.changes.length, 0);
  assert.equal(result.summary.errors, 0);
  assert.equal(result.summary.warnings, 0);
  assert.equal(shouldFailRegression(result, "warning"), false);
});

test("detects capability expansion and new findings", () => {
  const result = compareSkillTargets(baseline, candidate);
  const codes = new Set(result.changes.map((item) => item.code));
  assert.ok(codes.has("REG010"));
  assert.ok(codes.has("REG011"));
  assert.ok(codes.has("REG013"));
  assert.ok(codes.has("REG001"));
  assert.equal(result.summary.warnings > 0, true);
  assert.equal(shouldFailRegression(result, "warning"), true);
});

test("renders a machine-readable regression contract", () => {
  const result = compareSkillTargets(baseline, candidate);
  const parsed = JSON.parse(renderRegressionReport(result, "json"));
  assert.equal(parsed.schemaVersion, "skillconform.regression/v1");
  assert.equal(Array.isArray(parsed.changes), true);
});
