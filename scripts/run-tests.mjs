import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const testDirectory = fileURLToPath(new URL("../dist/test/", import.meta.url));

async function collectTests(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTests(path));
    if (entry.isFile() && entry.name.endsWith(".test.js")) files.push(path);
  }

  return files;
}

const tests = await collectTests(testDirectory);
if (tests.length === 0) {
  process.stderr.write(`No compiled tests found in ${testDirectory}\n`);
  process.exit(1);
}

const runner = spawn(process.execPath, ["--test", ...tests], { stdio: "inherit" });
runner.on("error", (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
runner.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
