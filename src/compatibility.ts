import { relative, resolve, sep } from "node:path";
import { buildCapabilityInventory } from "./inventory.js";
import { scanTarget } from "./scanner.js";
import type {
  CompatibilityCheck,
  CompatibilityMatrix,
  CompatibilityProfile,
  CompatibilityResult,
  CompatibilityStatus,
  SkillCapabilityProfile,
} from "./types.js";

export const COMPATIBILITY_PROFILE_SET_VERSION = "2026-09-23";

const PROFILES: readonly CompatibilityProfile[] = [
  {
    id: "agent-skills",
    label: "Agent Skills standard",
    source: "https://agentskills.io/specification",
    networkPolicy: "host-defined",
    runtimePackageInstall: "host-defined",
    discoveryPattern: null,
    notes: "Portable baseline. Runtime permissions and execution environment are host-defined.",
  },
  {
    id: "claude-code",
    label: "Claude Code",
    source: "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview",
    networkPolicy: "full",
    runtimePackageInstall: "discouraged",
    discoveryPattern: ".claude/skills/<skill-name>/SKILL.md",
    notes: "Project skills are auto-discovered from .claude/skills. Skills share the local Claude Code execution environment.",
  },
  {
    id: "claude-api",
    label: "Claude API",
    source: "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview",
    networkPolicy: "none",
    runtimePackageInstall: "none",
    discoveryPattern: null,
    notes: "Custom skills run in the code-execution container with no network access and no runtime package installation.",
  },
  {
    id: "openai-skills",
    label: "OpenAI Skills",
    source: "https://developers.openai.com/api/docs/guides/tools-skills",
    networkPolicy: "host-defined",
    runtimePackageInstall: "host-defined",
    discoveryPattern: null,
    notes: "OpenAI supports the open Agent Skills format in local and hosted execution surfaces; host behavior can differ.",
  },
  {
    id: "gemini-cli",
    label: "Gemini CLI",
    source: "https://codelabs.developers.google.com/gemini-cli/how-to-create-agent-skills-for-gemini-cli",
    networkPolicy: "host-defined",
    runtimePackageInstall: "host-defined",
    discoveryPattern: ".agents/skills/<skill-name>/SKILL.md",
    notes: "Project skills are discovered from .agents/skills in the documented Gemini CLI workflow.",
  },
];

export function getCompatibilityProfiles(): CompatibilityProfile[] {
  return PROFILES.map((profile) => ({ ...profile }));
}

export function buildCompatibilityMatrix(targetInput: string): CompatibilityMatrix {
  const target = resolve(targetInput);
  const inventory = buildCapabilityInventory(target);
  const conformance = scanTarget(target, "check");
  const errorsByFile = new Map<string, number>();

  for (const finding of conformance.findings) {
    if (finding.severity !== "error") continue;
    errorsByFile.set(finding.file, (errorsByFile.get(finding.file) ?? 0) + 1);
  }

  return {
    schemaVersion: "skillconform.compatibility/v1",
    profileSetVersion: COMPATIBILITY_PROFILE_SET_VERSION,
    target: inventory.target,
    profiles: getCompatibilityProfiles(),
    skills: inventory.skills.map((skill) => ({
      skillFile: skill.skillFile,
      ...(skill.name ? { name: skill.name } : {}),
      results: PROFILES.map((profile) => evaluateProfile(
        skill,
        profile,
        target,
        errorsByFile.get(skill.skillFile) ?? 0,
      )),
    })),
  };
}

export function renderCompatibilityMatrix(matrix: CompatibilityMatrix, format: "pretty" | "json"): string {
  if (format === "json") return `${JSON.stringify(matrix, null, 2)}\n`;

  const lines = [
    "SkillConform compatibility matrix",
    `Profile set: ${matrix.profileSetVersion}`,
    `Scanned ${matrix.skills.length} skill${matrix.skills.length === 1 ? "" : "s"}.`,
  ];

  for (const skill of matrix.skills) {
    lines.push("", `Skill: ${skill.name ?? skill.skillFile}`);
    for (const result of skill.results) {
      const profile = matrix.profiles.find((item) => item.id === result.profileId);
      lines.push(`  ${statusLabel(result.status).padEnd(11)} ${profile?.label ?? result.profileId}`);
      for (const check of result.checks) {
        if (check.status !== "pass") lines.push(`    - ${check.id}: ${check.reason}`);
      }
    }
  }

  lines.push("", "PASS = no static portability blocker found; REVIEW = host/runtime evidence is still required; UNSUPPORTED = documented constraint is contradicted.");
  return `${lines.join("\n")}\n`;
}

function evaluateProfile(
  skill: SkillCapabilityProfile,
  profile: CompatibilityProfile,
  targetRoot: string,
  conformanceErrors: number,
): CompatibilityResult {
  const checks: CompatibilityCheck[] = [];

  checks.push({
    id: "conformance",
    status: conformanceErrors > 0 ? "unsupported" : "pass",
    reason: conformanceErrors > 0
      ? `${conformanceErrors} Agent Skills conformance error(s) must be fixed first.`
      : "No core conformance error was found.",
  });

  if (profile.id === "claude-code" || profile.id === "claude-api") {
    const name = skill.name?.toLowerCase() ?? "";
    const reserved = /(?:^|-)(?:anthropic|claude)(?:-|$)/.test(name);
    checks.push({
      id: "claude-name",
      status: reserved ? "unsupported" : "pass",
      reason: reserved
        ? "Claude skill names cannot contain the reserved words 'anthropic' or 'claude'."
        : "No Claude-reserved word was detected in the skill name.",
    });
  }

  if (profile.networkPolicy === "none") {
    checks.push({
      id: "network",
      status: skill.capabilities.network ? "unsupported" : "pass",
      reason: skill.capabilities.network
        ? `Network use was detected${skill.networkHosts.length ? ` for ${skill.networkHosts.join(", ")}` : ""}, but this profile documents no network access.`
        : "No network requirement was detected.",
    });
  } else if (profile.networkPolicy === "host-defined" && skill.capabilities.network) {
    checks.push({
      id: "network",
      status: "review",
      reason: "Network use was detected; availability and allowlists depend on the selected host/runtime.",
    });
  } else {
    checks.push({
      id: "network",
      status: "pass",
      reason: skill.capabilities.network ? "Network use is compatible with the documented runtime model." : "No network requirement was detected.",
    });
  }

  if (profile.id === "claude-api" && skill.capabilities.bundledScripts) {
    checks.push({
      id: "runtime-dependencies",
      status: "review",
      reason: "Bundled scripts are supported, but the Claude API runtime cannot install packages at execution time; required dependencies must already exist.",
    });
  }

  if ((profile.id === "openai-skills" || profile.id === "gemini-cli") && skill.allowedTools.length > 0) {
    checks.push({
      id: "tool-permissions",
      status: "review",
      reason: "The skill declares allowed-tools; permission syntax and enforcement are host-specific and require runtime verification.",
    });
  }

  if (profile.discoveryPattern) {
    const relativeSkill = normalizePath(relative(targetRoot, resolve(process.cwd(), skill.skillFile)));
    const discovered = profile.id === "claude-code"
      ? /^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(relativeSkill)
      : /^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(relativeSkill);
    checks.push({
      id: "project-discovery",
      status: discovered ? "pass" : "review",
      reason: discovered
        ? `The skill is located at the documented project discovery path (${profile.discoveryPattern}).`
        : `Automatic project discovery expects ${profile.discoveryPattern}; direct, plugin, or user-level installation may use a different path.`,
    });
  }

  return {
    profileId: profile.id,
    status: summarizeStatus(checks),
    checks,
  };
}

function summarizeStatus(checks: CompatibilityCheck[]): CompatibilityStatus {
  if (checks.some((check) => check.status === "unsupported")) return "unsupported";
  if (checks.some((check) => check.status === "review")) return "review";
  return "pass";
}

function statusLabel(status: CompatibilityStatus): string {
  if (status === "unsupported") return "UNSUPPORTED";
  if (status === "review") return "REVIEW";
  return "PASS";
}

function normalizePath(value: string): string {
  return value.split(sep).join("/");
}
