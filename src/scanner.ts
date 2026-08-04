import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { parseSkill } from "./frontmatter.js";
import { runConformanceRules, runSecurityRules } from "./rules.js";
import type { Finding, ScanMode, ScanResult, ScanSummary } from "./types.js";

const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "dist", "coverage", ".next", ".venv", "venv"]);
const TEXT_EXTENSIONS = new Set(["", ".md", ".txt", ".yaml", ".yml", ".json", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".py", ".sh", ".bash", ".zsh", ".ps1", ".rb", ".go", ".rs", ".toml"]);

export function scanTarget(targetInput: string, mode: ScanMode = "check"): ScanResult {
  const target = resolve(targetInput);
  const skillFiles = discoverSkillFiles(target);
  const findings: Finding[] = [];

  if (skillFiles.length === 0) {
    findings.push({
      ruleId: "SC000",
      severity: "error",
      message: "No SKILL.md file was found at or below the target path.",
      file: normalizePath(target),
      suggestion: "Point SkillConform at a skill directory, SKILL.md file, or workspace containing skills.",
      helpUri: "https://agentskills.io/specification",
    });
  }

  for (const skillFile of skillFiles) {
    const raw = readFileSync(skillFile, "utf8");
    const skill = parseSkill(normalizePath(relative(process.cwd(), skillFile) || skillFile), raw);
    skill.skillDir = dirname(skillFile);
    findings.push(...runConformanceRules(skill));

    if (mode === "audit") {
      findings.push(...runSecurityRules(skill, discoverTextFiles(skill.skillDir)));
    }
  }

  findings.sort(compareFindings);
  return {
    target: normalizePath(target),
    mode,
    skillCount: skillFiles.length,
    findings,
    summary: summarize(findings),
  };
}

export function discoverSkillFiles(target: string): string[] {
  if (!existsSync(target)) return [];
  const status = statSync(target);
  if (status.isFile()) return basename(target) === "SKILL.md" ? [target] : [];
  if (!status.isDirectory()) return [];

  const direct = join(target, "SKILL.md");
  if (existsSync(direct) && statSync(direct).isFile()) return [direct];

  const results: string[] = [];
  walk(target, (file) => {
    if (basename(file) === "SKILL.md") results.push(file);
  });
  return results.sort();
}

function discoverTextFiles(root: string): string[] {
  const results: string[] = [];
  walk(root, (file) => {
    if (TEXT_EXTENSIONS.has(extname(file).toLowerCase())) results.push(file);
  });
  return results;
}

function walk(root: string, onFile: (path: string) => void): void {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) walk(fullPath, onFile);
    } else if (entry.isFile()) {
      onFile(fullPath);
    }
  }
}

function summarize(findings: Finding[]): ScanSummary {
  return findings.reduce<ScanSummary>((summary, item) => {
    if (item.severity === "error") summary.errors += 1;
    else if (item.severity === "warning") summary.warnings += 1;
    else summary.notes += 1;
    return summary;
  }, { errors: 0, warnings: 0, notes: 0 });
}

function compareFindings(left: Finding, right: Finding): number {
  const severityOrder = { error: 0, warning: 1, note: 2 } as const;
  return severityOrder[left.severity] - severityOrder[right.severity]
    || left.file.localeCompare(right.file)
    || (left.line ?? 0) - (right.line ?? 0)
    || left.ruleId.localeCompare(right.ruleId);
}

function normalizePath(value: string): string {
  return value.split(sep).join("/");
}
