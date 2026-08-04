import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { isRecord, lineForField, lineForText } from "./frontmatter.js";
import type { Finding, ParsedSkill } from "./types.js";

const SPEC_URI = "https://agentskills.io/specification";

const KNOWN_FIELDS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
]);

export function runConformanceRules(skill: ParsedSkill): Finding[] {
  const findings: Finding[] = [];
  const file = skill.skillFile;

  for (const message of skill.parseErrors) {
    findings.push({
      ruleId: "SC001",
      severity: "error",
      message,
      file,
      line: 1,
      suggestion: "Add valid YAML frontmatter with name and description fields.",
      helpUri: SPEC_URI,
    });
  }

  if (!skill.frontmatter) return findings;
  const metadata = skill.frontmatter;
  const name = metadata.name;
  const description = metadata.description;

  if (typeof name !== "string" || name.trim().length === 0) {
    findings.push(finding("SC002", "error", "The required name field is missing or empty.", file, lineForField(skill.raw, "name")));
  } else {
    if (name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      findings.push({
        ...finding("SC003", "error", "The name must be 1-64 characters using lowercase letters, numbers, and single hyphens.", file, lineForField(skill.raw, "name")),
        suggestion: "Use a lowercase hyphenated name such as data-analysis.",
      });
    }

    const directoryName = skill.skillDir.split(/[\\/]/).filter(Boolean).at(-1);
    if (directoryName && name !== directoryName) {
      findings.push({
        ...finding("SC004", "error", `The name '${name}' must match its parent directory '${directoryName}'.`, file, lineForField(skill.raw, "name")),
        suggestion: `Rename the directory to '${name}' or update the name field.`,
      });
    }
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    findings.push(finding("SC005", "error", "The required description field is missing or empty.", file, lineForField(skill.raw, "description")));
  } else {
    if (description.length > 1024) {
      findings.push(finding("SC006", "error", "The description exceeds the 1,024 character limit.", file, lineForField(skill.raw, "description")));
    }
    if (description.trim().split(/\s+/).length < 6) {
      findings.push({
        ...finding("SC007", "warning", "The description is too vague to support reliable skill discovery.", file, lineForField(skill.raw, "description")),
        suggestion: "Describe what the skill does and the requests that should trigger it.",
      });
    }
  }

  if ("license" in metadata && typeof metadata.license !== "string") {
    findings.push(finding("SC008", "error", "The license field must be a string.", file, lineForField(skill.raw, "license")));
  }

  if ("compatibility" in metadata) {
    if (typeof metadata.compatibility !== "string") {
      findings.push(finding("SC009", "error", "The compatibility field must be a string.", file, lineForField(skill.raw, "compatibility")));
    } else if (metadata.compatibility.length === 0 || metadata.compatibility.length > 500) {
      findings.push(finding("SC010", "error", "The compatibility field must contain 1-500 characters.", file, lineForField(skill.raw, "compatibility")));
    }
  }

  if ("metadata" in metadata) {
    if (!isRecord(metadata.metadata)) {
      findings.push(finding("SC011", "error", "The metadata field must be a key-value mapping.", file, lineForField(skill.raw, "metadata")));
    } else {
      for (const [key, value] of Object.entries(metadata.metadata)) {
        if (typeof value !== "string") {
          findings.push(finding("SC012", "error", `Metadata value '${key}' must be a string.`, file, lineForField(skill.raw, "metadata")));
        }
      }
    }
  }

  if ("allowed-tools" in metadata && typeof metadata["allowed-tools"] !== "string") {
    findings.push(finding("SC013", "error", "The allowed-tools field must be a space-separated string.", file, lineForField(skill.raw, "allowed-tools")));
  }

  for (const key of Object.keys(metadata)) {
    if (!KNOWN_FIELDS.has(key)) {
      findings.push({
        ...finding("SC014", "warning", `Unknown frontmatter field '${key}' may not be portable across Agent Skills clients.`, file, lineForField(skill.raw, key)),
        suggestion: "Move client-specific values under metadata or document the compatibility requirement.",
      });
    }
  }

  const lineCount = skill.raw.split(/\r?\n/).length;
  if (lineCount > 500) {
    findings.push({
      ...finding("SC015", "warning", `SKILL.md has ${lineCount} lines; the specification recommends fewer than 500.`, file, 1),
      suggestion: "Move detailed material into focused files under references/.",
    });
  }

  const estimatedTokens = Math.ceil(skill.body.trim().split(/\s+/).filter(Boolean).length * 1.35);
  if (estimatedTokens > 5_000) {
    findings.push({
      ...finding("SC016", "warning", `The instruction body is approximately ${estimatedTokens.toLocaleString()} tokens; fewer than 5,000 is recommended.`, file, 1),
      suggestion: "Keep the core workflow in SKILL.md and load references only when needed.",
    });
  }

  findings.push(...checkLocalReferences(skill));
  return findings;
}

export function runSecurityRules(skill: ParsedSkill, files: string[]): Finding[] {
  const findings: Finding[] = [];
  const compatibility = typeof skill.frontmatter?.compatibility === "string" ? skill.frontmatter.compatibility.toLowerCase() : "";
  let sawNetworkUse = false;

  const dangerousPatterns: Array<[RegExp, string]> = [
    [/\brm\s+-[a-z]*r[a-z]*f\b/i, "recursive forced deletion"],
    [/\bcurl\b[^\n|]*\|\s*(?:ba)?sh\b/i, "piping a download directly into a shell"],
    [/\bwget\b[^\n|]*\|\s*(?:ba)?sh\b/i, "piping a download directly into a shell"],
    [/\bchmod\s+(?:-R\s+)?777\b/i, "world-writable permissions"],
    [/\b(?:sudo|su)\b/i, "privilege escalation"],
    [/\bInvoke-Expression\b|\biex\s*\(/i, "dynamic PowerShell execution"],
    [/\beval\s*\(/i, "dynamic code evaluation"],
  ];

  const injectionPatterns: Array<[RegExp, string]> = [
    [/ignore\s+(?:all\s+)?(?:previous|prior|system)\s+instructions/i, "instruction override language"],
    [/(?:reveal|print|expose)\s+(?:the\s+)?system\s+prompt/i, "system prompt extraction language"],
    [/(?:disable|bypass)\s+(?:all\s+)?(?:safety|security|guardrails)/i, "safety bypass language"],
  ];

  const secretPatterns: Array<[RegExp, string]> = [
    [/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/, "GitHub token"],
    [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
    [/\bsk-[A-Za-z0-9_-]{20,}\b/, "API key"],
    [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key"],
  ];

  for (const filePath of files) {
    let raw: string;
    try {
      if (statSync(filePath).size > 1_000_000) continue;
      raw = readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    const displayFile = normalizeFile(filePath);
    for (const [pattern, label] of dangerousPatterns) {
      const match = pattern.exec(raw);
      if (match) {
        findings.push({
          ...finding("SEC001", "warning", `Potentially dangerous operation detected: ${label}.`, displayFile, lineForText(raw, match[0])),
          suggestion: "Use the least destructive command possible and require explicit user confirmation.",
        });
      }
    }

    for (const [pattern, label] of secretPatterns) {
      const match = pattern.exec(raw);
      if (match) {
        findings.push({
          ...finding("SEC002", "error", `Possible embedded secret detected: ${label}.`, displayFile, lineForText(raw, match[0])),
          suggestion: "Remove the value, rotate it, and load secrets from a secure environment variable or secret store.",
        });
      }
    }

    for (const [pattern, label] of injectionPatterns) {
      const match = pattern.exec(raw);
      if (match) {
        findings.push({
          ...finding("SEC003", "warning", `Potential prompt-injection behavior detected: ${label}.`, displayFile, lineForText(raw, match[0])),
          suggestion: "Remove attempts to override host, system, user, or safety instructions.",
        });
      }
    }

    if (/https?:\/\//i.test(raw) || /\b(?:curl|wget|fetch)\b/i.test(raw)) sawNetworkUse = true;
  }

  const allowedTools = skill.frontmatter?.["allowed-tools"];
  if (typeof allowedTools === "string" && /Bash\(\s*\*\s*\)|Shell\(\s*\*\s*\)|\bBash\b(?!\()/i.test(allowedTools)) {
    findings.push({
      ...finding("SEC004", "warning", "The skill pre-approves broad shell access.", skill.skillFile, lineForField(skill.raw, "allowed-tools")),
      suggestion: "Allow only the exact command families required by the workflow.",
    });
  }

  if (sawNetworkUse && !/(internet|network|http|api|remote)/i.test(compatibility)) {
    findings.push({
      ...finding("SEC005", "warning", "The skill appears to use the network but does not declare that requirement in compatibility.", skill.skillFile, lineForField(skill.raw, "compatibility") ?? 1),
      suggestion: "Document required network access and remote services in the compatibility field.",
    });
  }

  return deduplicate(findings);
}

function checkLocalReferences(skill: ParsedSkill): Finding[] {
  const findings: Finding[] = [];
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of skill.body.matchAll(linkPattern)) {
    const rawReference = match[1]?.trim();
    if (!rawReference || /^(?:https?:|mailto:|#)/i.test(rawReference)) continue;
    const reference = rawReference.split("#", 1)[0];
    if (!reference) continue;

    if (isAbsolute(reference) || reference.split(/[\\/]/).includes("..")) {
      findings.push({
        ...finding("SC017", "error", `Reference '${rawReference}' escapes the skill directory.`, skill.skillFile, lineForText(skill.raw, match[0])),
        suggestion: "Bundle the resource inside the skill and use a relative path from the skill root.",
      });
      continue;
    }

    const resolved = resolve(skill.skillDir, reference);
    const rel = relative(skill.skillDir, resolved);
    if (rel.startsWith(`..${sep}`) || rel === "..") continue;
    if (!existsSync(resolved)) {
      findings.push({
        ...finding("SC018", "error", `Referenced file '${rawReference}' does not exist.`, skill.skillFile, lineForText(skill.raw, match[0])),
        suggestion: "Add the referenced file or correct the relative path.",
      });
    }
  }
  return findings;
}

function finding(ruleId: string, severity: Finding["severity"], message: string, file: string, line?: number): Finding {
  return {
    ruleId,
    severity,
    message,
    file: normalizeFile(file),
    ...(line === undefined ? {} : { line }),
    helpUri: ruleId.startsWith("SC") ? SPEC_URI : "https://github.com/GenRamzi/skillconform/blob/main/docs/rules.md",
  };
}

function normalizeFile(file: string): string {
  const relativeFile = relative(process.cwd(), file);
  const displayFile = relativeFile === ".." || relativeFile.startsWith(`..${sep}`) ? file : relativeFile;
  return displayFile.split(sep).join("/");
}

function deduplicate(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((item) => {
    const key = `${item.ruleId}:${item.file}:${item.line ?? 0}:${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
