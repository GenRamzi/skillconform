import { parseDocument } from "yaml";
import type { ParsedSkill } from "./types.js";

export function parseSkill(skillFile: string, rawInput: string): ParsedSkill {
  const raw = rawInput.replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/);
  const parseErrors: string[] = [];

  if (lines[0]?.trim() !== "---") {
    return {
      skillDir: "",
      skillFile,
      raw,
      body: raw,
      frontmatterRaw: "",
      frontmatter: null,
      parseErrors: ["SKILL.md must start with YAML frontmatter delimited by ---"],
    };
  }

  let closingIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    const value = lines[index]?.trim();
    if (value === "---" || value === "...") {
      closingIndex = index;
      break;
    }
  }

  if (closingIndex === -1) {
    return {
      skillDir: "",
      skillFile,
      raw,
      body: "",
      frontmatterRaw: lines.slice(1).join("\n"),
      frontmatter: null,
      parseErrors: ["YAML frontmatter is missing its closing --- delimiter"],
    };
  }

  const frontmatterRaw = lines.slice(1, closingIndex).join("\n");
  const body = lines.slice(closingIndex + 1).join("\n");
  const document = parseDocument(frontmatterRaw, { prettyErrors: true, strict: true });

  for (const error of document.errors) {
    parseErrors.push(error.message.replace(/\n/g, " "));
  }

  let frontmatter: Record<string, unknown> | null = null;
  if (parseErrors.length === 0) {
    const value: unknown = document.toJS();
    if (isRecord(value)) {
      frontmatter = value;
    } else {
      parseErrors.push("YAML frontmatter must be a key-value mapping");
    }
  }

  return {
    skillDir: "",
    skillFile,
    raw,
    body,
    frontmatterRaw,
    frontmatter,
    parseErrors,
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function lineForField(raw: string, field: string): number | undefined {
  const lines = raw.split(/\r?\n/);
  const pattern = new RegExp(`^\\s*${escapeRegExp(field)}\\s*:`);
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : undefined;
}

export function lineForText(raw: string, needle: string): number | undefined {
  const index = raw.indexOf(needle);
  if (index < 0) return undefined;
  return raw.slice(0, index).split(/\r?\n/).length;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
