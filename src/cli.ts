#!/usr/bin/env node
import { resolve } from "node:path";
import { createPolicyConfig, runPolicyTests } from "./policy-tests.js";
import { renderReport, shouldFail, writeReport } from "./reporters.js";
import { scanTarget } from "./scanner.js";
import type { CliOptions, OutputFormat, Severity } from "./types.js";

const VERSION = "0.1.0";

interface ParsedArguments {
  command: string;
  target: string;
  options: CliOptions;
}

async function main(): Promise<void> {
  try {
    const parsed = parseArguments(process.argv.slice(2));
    if (parsed.command === "help") {
      process.stdout.write(helpText());
      return;
    }
    if (parsed.command === "version") {
      process.stdout.write(`${VERSION}\n`);
      return;
    }
    if (parsed.command === "init") {
      const output = resolve(parsed.target === "." ? "skillconform.yaml" : parsed.target);
      createPolicyConfig(output);
      process.stdout.write(`Created ${output}\n`);
      return;
    }
    if (parsed.command === "test") {
      const results = runPolicyTests(parsed.target);
      const payload = parsed.options.format === "json"
        ? `${JSON.stringify({ passed: results.every((item) => item.passed), tests: results }, null, 2)}\n`
        : renderPolicyTests(results);
      writeReport(payload, parsed.options.output);
      process.exitCode = results.every((item) => item.passed) ? 0 : 1;
      return;
    }

    const mode = parsed.command === "audit" ? "audit" : "check";
    const result = scanTarget(parsed.target, mode);
    if (!parsed.options.quiet || parsed.options.output) {
      writeReport(renderReport(result, parsed.options.format), parsed.options.output);
    }
    process.exitCode = shouldFail(result, parsed.options.failOn) ? 1 : 0;
  } catch (error) {
    process.stderr.write(`SkillConform: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}

function parseArguments(args: string[]): ParsedArguments {
  if (args.length === 0) return { command: "help", target: ".", options: defaults() };
  if (args.includes("--help") || args.includes("-h")) return { command: "help", target: ".", options: defaults() };
  if (args.includes("--version") || args.includes("-v")) return { command: "version", target: ".", options: defaults() };

  const command = args[0] ?? "help";
  if (!["check", "audit", "test", "init"].includes(command)) throw new Error(`Unknown command '${command}'. Run skillconform --help.`);
  let target = command === "test" ? "skillconform.yaml" : ".";
  const options = defaults();

  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) continue;
    if (arg === "--format") {
      const value = args[++index];
      if (value !== "pretty" && value !== "json" && value !== "sarif") throw new Error("--format must be pretty, json, or sarif.");
      if (command === "test" && value === "sarif") throw new Error("The test command supports pretty or json output.");
      options.format = value as OutputFormat;
    } else if (arg === "--output" || arg === "-o") {
      const value = args[++index];
      if (!value) throw new Error(`${arg} requires a file path.`);
      options.output = value;
    } else if (arg === "--fail-on") {
      const value = args[++index];
      if (value !== "error" && value !== "warning" && value !== "note" && value !== "none") throw new Error("--fail-on must be error, warning, note, or none.");
      options.failOn = value as Severity | "none";
    } else if (arg === "--quiet" || arg === "-q") {
      options.quiet = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option '${arg}'.`);
    } else {
      target = arg;
    }
  }
  return { command, target, options };
}

function defaults(): CliOptions {
  return { format: "pretty", failOn: "error", quiet: false };
}

function renderPolicyTests(results: ReturnType<typeof runPolicyTests>): string {
  const lines = ["SkillConform policy tests"];
  for (const result of results) {
    lines.push(`${result.passed ? "PASS" : "FAIL"} ${result.name}`);
    for (const failure of result.failures) lines.push(`  - ${failure}`);
  }
  const passed = results.filter((item) => item.passed).length;
  lines.push("", `${passed}/${results.length} test(s) passed`);
  return `${lines.join("\n")}\n`;
}

function helpText(): string {
  return `SkillConform ${VERSION}

Conformance, security, and regression testing for Agent Skills.

Usage:
  skillconform check [path] [options]
  skillconform audit [path] [options]
  skillconform test [skillconform.yaml] [options]
  skillconform init [output-file]

Options:
  --format <pretty|json|sarif>  Report format (default: pretty)
  --output, -o <file>          Write the report to a file
  --fail-on <level>            error, warning, note, or none (default: error)
  --quiet, -q                  Suppress stdout unless --output is used
  --version, -v                Print the version
  --help, -h                   Show this help

Examples:
  skillconform check ./my-skill
  skillconform audit ./skills --fail-on warning
  skillconform audit . --format sarif -o skillconform.sarif
  skillconform test skillconform.yaml
`;
}

await main();
