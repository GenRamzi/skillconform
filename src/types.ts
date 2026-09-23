export type Severity = "error" | "warning" | "note";
export type ScanMode = "check" | "audit";
export type OutputFormat = "pretty" | "json" | "sarif";

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  file: string;
  line?: number;
  column?: number;
  suggestion?: string;
  helpUri?: string;
}

export interface ParsedSkill {
  skillDir: string;
  skillFile: string;
  raw: string;
  body: string;
  frontmatterRaw: string;
  frontmatter: Record<string, unknown> | null;
  parseErrors: string[];
}

export interface ScanSummary {
  errors: number;
  warnings: number;
  notes: number;
}

export interface ScanResult {
  target: string;
  mode: ScanMode;
  skillCount: number;
  findings: Finding[];
  summary: ScanSummary;
}

export interface SkillCapabilityProfile {
  skillFile: string;
  name?: string;
  compatibility?: string;
  allowedTools: string[];
  references: string[];
  scripts: string[];
  networkHosts: string[];
  capabilities: {
    network: boolean;
    shell: boolean;
    bundledScripts: boolean;
  };
  portabilityNotes: string[];
}

export interface CapabilityInventory {
  schemaVersion: "skillconform.capabilities/v1";
  target: string;
  skillCount: number;
  skills: SkillCapabilityProfile[];
}

export type CompatibilityStatus = "pass" | "review" | "unsupported";
export type NetworkPolicy = "full" | "none" | "host-defined";
export type RuntimePackageInstall = "allowed" | "none" | "discouraged" | "host-defined";

export interface CompatibilityProfile {
  id: "agent-skills" | "claude-code" | "claude-api" | "openai-skills" | "gemini-cli";
  label: string;
  source: string;
  networkPolicy: NetworkPolicy;
  runtimePackageInstall: RuntimePackageInstall;
  discoveryPattern: string | null;
  notes: string;
}

export interface CompatibilityCheck {
  id: string;
  status: CompatibilityStatus;
  reason: string;
}

export interface CompatibilityResult {
  profileId: CompatibilityProfile["id"];
  status: CompatibilityStatus;
  checks: CompatibilityCheck[];
}

export interface SkillCompatibilityResult {
  skillFile: string;
  name?: string;
  results: CompatibilityResult[];
}

export interface CompatibilityMatrix {
  schemaVersion: "skillconform.compatibility/v1";
  profileSetVersion: string;
  target: string;
  profiles: CompatibilityProfile[];
  skills: SkillCompatibilityResult[];
}

export interface RegressionChange {
  code: string;
  severity: Severity;
  skill: string;
  message: string;
  before?: string;
  after?: string;
}

export interface RegressionSkillSummary {
  skill: string;
  baselinePresent: boolean;
  candidatePresent: boolean;
  changeCount: number;
}

export interface RegressionSummary {
  errors: number;
  warnings: number;
  notes: number;
  resolvedFindings: number;
  changedSkills: number;
}

export interface RegressionReport {
  schemaVersion: "skillconform.regression/v1";
  baseline: string;
  candidate: string;
  skills: RegressionSkillSummary[];
  changes: RegressionChange[];
  summary: RegressionSummary;
}

export interface CliOptions {
  format: OutputFormat;
  output?: string;
  baseline?: string;
  failOn: Severity | "none";
  quiet: boolean;
}

export interface PolicyExpectation {
  errors?: number;
  warningsAtMost?: number;
  notesAtMost?: number;
  includeRules?: string[];
  excludeRules?: string[];
}

export interface PolicyTestCase {
  name: string;
  path: string;
  mode?: ScanMode;
  expect?: PolicyExpectation;
}

export interface PolicyTestConfig {
  version: number;
  tests: PolicyTestCase[];
}

export interface PolicyTestResult {
  name: string;
  passed: boolean;
  failures: string[];
  scan: ScanResult;
}
