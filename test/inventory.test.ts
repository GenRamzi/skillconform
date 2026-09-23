import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { buildCapabilityInventory, renderCapabilityInventory } from "../src/inventory.js";

const fixtures = join(process.cwd(), "test", "fixtures");

test("builds a deterministic capability inventory", () => {
  const result = buildCapabilityInventory(join(fixtures, "valid-skill"));
  assert.equal(result.skillCount, 1);
  assert.equal(result.skills.length, 1);
  assert.equal(Array.isArray(result.skills[0]?.allowedTools), true);
  assert.equal(Array.isArray(result.skills[0]?.scripts), true);
  assert.equal(Array.isArray(result.skills[0]?.portabilityNotes), true);
});

test("renders capability inventory as JSON", () => {
  const result = buildCapabilityInventory(join(fixtures, "valid-skill"));
  const parsed = JSON.parse(renderCapabilityInventory(result, "json"));
  assert.equal(parsed.skillCount, 1);
  assert.ok(parsed.skills[0].capabilities);
});
