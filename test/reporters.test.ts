import assert from "node:assert/strict";
import test from "node:test";
import { renderReport, shouldFail } from "../src/reporters.js";
import type { ScanResult } from "../src/types.js";

const result: ScanResult = {
  target: "/example",
  mode: "check",
  skillCount: 1,
  findings: [{ ruleId: "SC002", severity: "error", message: "Missing name.", file: "SKILL.md", line: 2 }],
  summary: { errors: 1, warnings: 0, notes: 0 },
};

test("renders SARIF 2.1.0", () => {
  const sarif = JSON.parse(renderReport(result, "sarif")) as { version: string; runs: unknown[] };
  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs.length, 1);
});

test("applies failure thresholds", () => {
  assert.equal(shouldFail(result, "error"), true);
  assert.equal(shouldFail(result, "none"), false);
});
