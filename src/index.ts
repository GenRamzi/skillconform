export { buildCompatibilityMatrix, getCompatibilityProfiles, renderCompatibilityMatrix } from "./compatibility.js";
export { parseSkill } from "./frontmatter.js";
export { buildCapabilityInventory, renderCapabilityInventory } from "./inventory.js";
export { runPolicyTests } from "./policy-tests.js";
export { renderReport, shouldFail } from "./reporters.js";
export { discoverSkillFiles, scanTarget } from "./scanner.js";
export type {
  CapabilityInventory,
  CompatibilityCheck,
  CompatibilityMatrix,
  CompatibilityProfile,
  CompatibilityResult,
  CompatibilityStatus,
  Finding,
  OutputFormat,
  ParsedSkill,
  PolicyTestConfig,
  PolicyTestResult,
  ScanMode,
  ScanResult,
  Severity,
  SkillCapabilityProfile,
  SkillCompatibilityResult,
} from "./types.js";
