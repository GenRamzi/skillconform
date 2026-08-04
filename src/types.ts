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

export interface CliOptions {
  format: OutputFormat;
  output?: string;
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
