import { dirname, relative, resolve, sep } from "node:path";
import { buildCapabilityInventory } from "./inventory.js";
import { scanTarget } from "./scanner.js";
import type {
  Finding,
  RegressionChange,
  RegressionReport,
  RegressionSkillSummary,
  ScanResult,
  Severity,
  SkillCapabilityProfile,
} from "./types.js";

export function compareSkillTargets(baselineInput: string, candidateInput: string): RegressionReport {
  const baselineTarget = resolve(baselineInput);
  const candidateTarget = resolve(candidateInput);
  const baselineInventory = buildCapabilityInventory(baselineTarget);
  const candidateInventory = buildCapabilityInventory(candidateTarget);
  const baselineScan = scanTarget(baselineTarget, "audit");
  const candidateScan = scanTarget(candidateTarget, "audit");

  const baselineSkills = skillMap(baselineInventory.skills);
  const candidateSkills = skillMap(candidateInventory.skills);
  const keys = [...new Set([...baselineSkills.keys(), ...candidateSkills.keys()])].sort();
  const changes: RegressionChange[] = [];
  const skills: RegressionSkillSummary[] = [];
  let resolvedFindings = 0;

  for (const key of keys) {
    const baseline = baselineSkills.get(key);
    const candidate = candidateSkills.get(key);

    if (!baseline && candidate) {
      changes.push(change("REG021", "note", key, "New skill added in the candidate.", undefined, candidate.skillFile));
      skills.push({ skill: key, baselinePresent: false, candidatePresent: true, changeCount: 1 });
      continue;
    }

    if (baseline && !candidate) {
      changes.push(change("REG020", "warning", key, "Skill present in the baseline is missing from the candidate.", baseline.skillFile, undefined));
      skills.push({ skill: key, baselinePresent: true, candidatePresent: false, changeCount: 1 });
      continue;
    }

    if (!baseline || !candidate) continue;
    const beforeCount = changes.length;

    compareCapabilityBoolean(changes, key, "REG010", "warning", "network access", baseline.capabilities.network, candidate.capabilities.network);
    compareCapabilityBoolean(changes, key, "REG011", "warning", "shell usage", baseline.capabilities.shell, candidate.capabilities.shell);
    compareCapabilityBoolean(changes, key, "REG012", "note", "bundled scripts", baseline.capabilities.bundledScripts, candidate.capabilities.bundledScripts);

    const addedTools = candidate.allowedTools.filter((tool) => !baseline.allowedTools.includes(tool));
    if (addedTools.length > 0) {
      changes.push(change(
        "REG013",
        "warning",
        key,
        `Candidate expands declared tool permissions: ${addedTools.join(", ")}.`,
        baseline.allowedTools.join(" ") || "none",
        candidate.allowedTools.join(" ") || "none",
      ));
    }

    const addedHosts = candidate.networkHosts.filter((host) => !baseline.networkHosts.includes(host));
    if (addedHosts.length > 0) {
      changes.push(change(
        "REG014",
        "note",
        key,
        `Candidate introduces network host(s): ${addedHosts.join(", ")}.`,
        baseline.networkHosts.join(", ") || "none",
        candidate.networkHosts.join(", ") || "none",
      ));
    }

    const baselineFindings = findingMapForSkill(baselineScan, baseline);
    const candidateFindings = findingMapForSkill(candidateScan, candidate);

    for (const [signature, finding] of candidateFindings) {
      if (baselineFindings.has(signature)) continue;
      changes.push(change(
        "REG001",
        finding.severity,
        key,
        `New ${finding.severity} finding ${finding.ruleId}: ${finding.message}`,
        undefined,
        finding.file,
      ));
    }

    for (const signature of baselineFindings.keys()) {
      if (!candidateFindings.has(signature)) resolvedFindings += 1;
    }

    skills.push({
      skill: key,
      baselinePresent: true,
      candidatePresent: true,
      changeCount: changes.length - beforeCount,
    });
  }

  changes.sort(compareChanges);
  return {
    schemaVersion: "skillconform.regression/v1",
    baseline: baselineInventory.target,
    candidate: candidateInventory.target,
    skills,
    changes,
    summary: {
      errors: changes.filter((item) => item.severity === "error").length,
      warnings: changes.filter((item) => item.severity === "warning").length,
      notes: changes.filter((item) => item.severity === "note").length,
      resolvedFindings,
      changedSkills: skills.filter((item) => item.changeCount > 0).length,
    },
  };
}

export function renderRegressionReport(report: RegressionReport, format: "pretty" | "json"): string {
  if (format === "json") return `${JSON.stringify(report, null, 2)}\n`;

  const lines = [
    "SkillConform regression report",
    `Baseline: ${report.baseline}`,
    `Candidate: ${report.candidate}`,
  ];

  for (const item of report.changes) {
    lines.push("", `${item.severity.toUpperCase()} ${item.code} ${item.skill}`);
    lines.push(`  ${item.message}`);
    if (item.before !== undefined) lines.push(`  Before: ${item.before}`);
    if (item.after !== undefined) lines.push(`  After: ${item.after}`);
  }

  lines.push(
    "",
    `${report.summary.errors} error(s), ${report.summary.warnings} warning(s), ${report.summary.notes} note(s), ${report.summary.resolvedFindings} resolved finding(s)`,
  );
  return `${lines.join("\n")}\n`;
}

export function shouldFailRegression(report: RegressionReport, failOn: Severity | "none"): boolean {
  if (failOn === "none") return false;
  if (failOn === "note") return report.changes.length > 0;
  if (failOn === "warning") return report.summary.errors > 0 || report.summary.warnings > 0;
  return report.summary.errors > 0;
}

function skillMap(skills: SkillCapabilityProfile[]): Map<string, SkillCapabilityProfile> {
  const result = new Map<string, SkillCapabilityProfile>();
  for (const skill of skills) {
    const key = skill.name ?? normalizePath(skill.skillFile);
    if (!result.has(key)) result.set(key, skill);
  }
  return result;
}

function findingMapForSkill(scan: ScanResult, skill: SkillCapabilityProfile): Map<string, Finding> {
  const root = dirname(resolve(process.cwd(), skill.skillFile));
  const result = new Map<string, Finding>();

  for (const finding of scan.findings) {
    const absoluteFinding = resolve(process.cwd(), finding.file);
    const rel = relative(root, absoluteFinding);
    if (rel === ".." || rel.startsWith(`..${sep}`)) continue;
    const signature = [
      finding.ruleId,
      finding.severity,
      normalizePath(rel),
      finding.message,
    ].join("|");
    result.set(signature, finding);
  }

  return result;
}

function compareCapabilityBoolean(
  changes: RegressionChange[],
  skill: string,
  code: string,
  severity: Severity,
  label: string,
  before: boolean,
  after: boolean,
): void {
  if (!before && after) {
    changes.push(change(code, severity, skill, `Candidate adds ${label} capability.`, "false", "true"));
  }
}

function change(
  code: string,
  severity: Severity,
  skill: string,
  message: string,
  before?: string,
  after?: string,
): RegressionChange {
  return {
    code,
    severity,
    skill,
    message,
    ...(before === undefined ? {} : { before }),
    ...(after === undefined ? {} : { after }),
  };
}

function compareChanges(left: RegressionChange, right: RegressionChange): number {
  const order = { error: 0, warning: 1, note: 2 } as const;
  return order[left.severity] - order[right.severity]
    || left.skill.localeCompare(right.skill)
    || left.code.localeCompare(right.code)
    || left.message.localeCompare(right.message);
}

function normalizePath(value: string): string {
  return value.split(sep).join("/");
}
