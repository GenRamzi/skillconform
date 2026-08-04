import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parse } from "yaml";
import { scanTarget } from "./scanner.js";
import type { PolicyExpectation, PolicyTestConfig, PolicyTestResult, ScanMode } from "./types.js";

export function runPolicyTests(configPathInput: string): PolicyTestResult[] {
  const configPath = resolve(configPathInput);
  if (!existsSync(configPath)) throw new Error(`Policy test file not found: ${configPathInput}`);
  const value: unknown = parse(readFileSync(configPath, "utf8"));
  const config = validateConfig(value);
  const baseDir = dirname(configPath);

  return config.tests.map((test) => {
    const scan = scanTarget(resolve(baseDir, test.path), test.mode ?? "audit");
    const failures = evaluate(scan.summary, scan.findings.map((item) => item.ruleId), test.expect ?? {});
    return { name: test.name, passed: failures.length === 0, failures, scan };
  });
}

export function createPolicyConfig(outputPath: string): void {
  if (existsSync(outputPath)) throw new Error(`${outputPath} already exists.`);
  const template = `version: 1
tests:
  - name: project skills pass conformance and security checks
    path: skills
    mode: audit
    expect:
      errors: 0
      warningsAtMost: 0
      excludeRules:
        - SEC001
        - SEC002
`;
  writeFileSync(outputPath, template, "utf8");
}

function validateConfig(value: unknown): PolicyTestConfig {
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.tests)) {
    throw new Error("Policy file must contain version: 1 and a tests array.");
  }

  const tests = value.tests.map((item, index) => {
    if (!isObject(item) || typeof item.name !== "string" || typeof item.path !== "string") {
      throw new Error(`Test ${index + 1} must contain string name and path fields.`);
    }
    if (item.mode !== undefined && item.mode !== "check" && item.mode !== "audit") {
      throw new Error(`Test '${item.name}' has an invalid mode.`);
    }
    if (item.expect !== undefined && !isObject(item.expect)) {
      throw new Error(`Test '${item.name}' expect field must be a mapping.`);
    }
    return {
      name: item.name,
      path: item.path,
      ...(item.mode === undefined ? {} : { mode: item.mode as ScanMode }),
      ...(item.expect === undefined ? {} : { expect: item.expect as PolicyExpectation }),
    };
  });
  return { version: 1, tests };
}

function evaluate(summary: { errors: number; warnings: number; notes: number }, rules: string[], expect: PolicyExpectation): string[] {
  const failures: string[] = [];
  if (expect.errors !== undefined && summary.errors !== expect.errors) failures.push(`expected ${expect.errors} errors, received ${summary.errors}`);
  if (expect.warningsAtMost !== undefined && summary.warnings > expect.warningsAtMost) failures.push(`expected at most ${expect.warningsAtMost} warnings, received ${summary.warnings}`);
  if (expect.notesAtMost !== undefined && summary.notes > expect.notesAtMost) failures.push(`expected at most ${expect.notesAtMost} notes, received ${summary.notes}`);
  for (const rule of expect.includeRules ?? []) if (!rules.includes(rule)) failures.push(`expected finding ${rule}`);
  for (const rule of expect.excludeRules ?? []) if (rules.includes(rule)) failures.push(`unexpected finding ${rule}`);
  return failures;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
