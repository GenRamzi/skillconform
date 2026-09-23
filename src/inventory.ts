import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { parseSkill } from "./frontmatter.js";
import { discoverSkillFiles } from "./scanner.js";
import type { CapabilityInventory, SkillCapabilityProfile } from "./types.js";

const SCRIPT_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".py", ".sh", ".bash", ".zsh", ".ps1", ".rb", ".go", ".rs"]);
const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "dist", "coverage", ".next", ".venv", "venv"]);

export function buildCapabilityInventory(targetInput: string): CapabilityInventory {
  const target = resolve(targetInput);
  const skillFiles = discoverSkillFiles(target);
  return {
    schemaVersion: "skillconform.capabilities/v1",
    target: normalizePath(target),
    skillCount: skillFiles.length,
    skills: skillFiles.map(profileSkill),
  };
}

function profileSkill(skillFile: string): SkillCapabilityProfile {
  const raw = readFileSync(skillFile, "utf8");
  const skill = parseSkill(normalizePath(relative(process.cwd(), skillFile) || skillFile), raw);
  skill.skillDir = dirname(skillFile);

  const metadata = skill.frontmatter ?? {};
  const allowedTools = typeof metadata["allowed-tools"] === "string"
    ? metadata["allowed-tools"].split(/\s+/).map((value) => value.trim()).filter(Boolean)
    : [];
  const compatibility = typeof metadata.compatibility === "string" ? metadata.compatibility : undefined;

  const files = discoverFiles(skill.skillDir);
  const scripts = files
    .filter((file) => SCRIPT_EXTENSIONS.has(extname(file).toLowerCase()))
    .map((file) => normalizePath(relative(skill.skillDir, file)));

  const references = extractLocalReferences(skill.body);
  const networkHosts = new Set<string>();
  let network = false;
  let shell = allowedTools.some((tool) => /^(?:bash|shell)(?:\(|$)/i.test(tool));

  for (const file of files) {
    if (statSync(file).size > 1_000_000) continue;
    let content = "";
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const match of content.matchAll(/https?:\/\/([^\s"'<>\])}]+)/gi)) {
      network = true;
      if (match[1]) networkHosts.add(match[1].toLowerCase());
    }
    if (/\b(?:curl|wget|fetch)\b/i.test(content)) network = true;
    if (/\b(?:bash|sh|zsh|pwsh|powershell)\b/i.test(content)) shell = true;
  }

  const notes: string[] = [];
  if (allowedTools.length === 0) notes.push("No allowed-tools declaration; host permission behavior must be reviewed per client.");
  if (network && !compatibility) notes.push("Network use detected without a compatibility declaration.");
  if (scripts.length > 0) notes.push("Bundled executable/source scripts require client and platform compatibility testing.");
  if (references.some((value) => value.includes(".."))) notes.push("Parent-directory references reduce portability.");

  return {
    skillFile: skill.skillFile,
    ...(typeof metadata.name === "string" ? { name: metadata.name } : {}),
    ...(compatibility ? { compatibility } : {}),
    allowedTools,
    references,
    scripts,
    networkHosts: [...networkHosts].sort(),
    capabilities: {
      network,
      shell,
      bundledScripts: scripts.length > 0,
    },
    portabilityNotes: notes,
  };
}

export function renderCapabilityInventory(inventory: CapabilityInventory, format: "pretty" | "json"): string {
  if (format === "json") return `${JSON.stringify(inventory, null, 2)}\n`;

  const lines = [
    "SkillConform capability inventory",
    `Scanned ${inventory.skillCount} skill${inventory.skillCount === 1 ? "" : "s"}.`,
  ];

  for (const skill of inventory.skills) {
    lines.push("", `- ${skill.name ?? basename(dirname(skill.skillFile))} (${skill.skillFile})`);
    lines.push(`  tools: ${skill.allowedTools.length ? skill.allowedTools.join(", ") : "not declared"}`);
    lines.push(`  network: ${skill.capabilities.network ? "detected" : "not detected"}`);
    lines.push(`  bundled scripts: ${skill.scripts.length}`);
    lines.push(`  local references: ${skill.references.length}`);
    if (skill.networkHosts.length) lines.push(`  hosts: ${skill.networkHosts.join(", ")}`);
    for (const note of skill.portabilityNotes) lines.push(`  note: ${note}`);
  }

  return `${lines.join("\n")}\n`;
}

function extractLocalReferences(body: string): string[] {
  const values = new Set<string>();
  for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const value = match[1]?.trim();
    if (!value || /^(?:https?:|mailto:|#)/i.test(value)) continue;
    values.add(value);
  }
  return [...values].sort();
}

function discoverFiles(root: string): string[] {
  if (!existsSync(root) || !statSync(root).isDirectory()) return [];
  const results: string[] = [];
  walk(root, results);
  return results.sort();
}

function walk(root: string, results: string[]): void {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) walk(fullPath, results);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
}

function normalizePath(value: string): string {
  return value.split(sep).join("/");
}
