import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Finding, OutputFormat, ScanResult, Severity } from "./types.js";

const colors = {
  red: "\u001b[31m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  bold: "\u001b[1m",
  reset: "\u001b[0m",
};

export function renderReport(result: ScanResult, format: OutputFormat): string {
  if (format === "json") return `${JSON.stringify(result, null, 2)}\n`;
  if (format === "sarif") return `${JSON.stringify(toSarif(result), null, 2)}\n`;
  return renderPretty(result);
}

export function writeReport(content: string, output?: string): void {
  if (!output) {
    process.stdout.write(content);
    return;
  }
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, content, "utf8");
}

export function shouldFail(result: ScanResult, failOn: Severity | "none"): boolean {
  if (failOn === "none") return false;
  if (failOn === "note") return result.findings.length > 0;
  if (failOn === "warning") return result.summary.errors > 0 || result.summary.warnings > 0;
  return result.summary.errors > 0;
}

function renderPretty(result: ScanResult): string {
  const useColor = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);
  const lines: string[] = [];
  lines.push(style(`SkillConform ${result.mode}`, "bold", useColor));
  lines.push(`Scanned ${result.skillCount} skill${result.skillCount === 1 ? "" : "s"}.`);

  for (const item of result.findings) {
    const location = `${item.file}${item.line ? `:${item.line}` : ""}`;
    const color = item.severity === "error" ? "red" : item.severity === "warning" ? "yellow" : "blue";
    lines.push("");
    lines.push(`${style(item.severity.toUpperCase(), color, useColor)} ${style(item.ruleId, "bold", useColor)} ${location}`);
    lines.push(`  ${item.message}`);
    if (item.suggestion) lines.push(`  Fix: ${item.suggestion}`);
  }

  lines.push("");
  lines.push(`${result.summary.errors} error(s), ${result.summary.warnings} warning(s), ${result.summary.notes} note(s)`);
  lines.push(result.summary.errors === 0 ? style("PASS", "blue", useColor) : style("FAIL", "red", useColor));
  return `${lines.join("\n")}\n`;
}

function toSarif(result: ScanResult): Record<string, unknown> {
  const rules = new Map<string, Finding>();
  for (const item of result.findings) if (!rules.has(item.ruleId)) rules.set(item.ruleId, item);
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [{
      tool: {
        driver: {
          name: "SkillConform",
          version: "0.1.0",
          informationUri: "https://github.com/GenRamzi/skillconform",
          rules: [...rules.values()].map((item) => ({
            id: item.ruleId,
            shortDescription: { text: item.message },
            helpUri: item.helpUri,
            defaultConfiguration: { level: sarifLevel(item.severity) },
          })),
        },
      },
      results: result.findings.map((item) => ({
        ruleId: item.ruleId,
        level: sarifLevel(item.severity),
        message: { text: item.message },
        locations: [{
          physicalLocation: {
            artifactLocation: { uri: item.file },
            region: {
              startLine: item.line ?? 1,
              startColumn: item.column ?? 1,
            },
          },
        }],
        fixes: item.suggestion ? [{ description: { text: item.suggestion } }] : undefined,
      })),
    }],
  };
}

function sarifLevel(severity: Severity): "error" | "warning" | "note" {
  return severity;
}

function style(value: string, color: keyof typeof colors, enabled: boolean): string {
  return enabled ? `${colors[color]}${value}${colors.reset}` : value;
}
