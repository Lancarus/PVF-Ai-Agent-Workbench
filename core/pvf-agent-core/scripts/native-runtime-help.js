"use strict";

const {
  helpLines,
  openOfficialRuntimePage,
  selfTest,
} = require("../lib/native-runtime-help");

const args = process.argv.slice(2);
const command = args.includes("self-test") ? "self-test" : "show";

if (command === "self-test") {
  const result = selfTest();
  process.stdout.write(`${JSON.stringify({
    schemaVersion: "1.0",
    phase: "native-runtime-help-self-test",
    summary: {
      ok: result.ok,
      checkCount: result.checks.length,
      failedChecks: result.checks.filter((check) => !check.ok).length,
    },
    checks: result.checks,
  }, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
} else {
  for (const line of helpLines()) process.stdout.write(`${line}\n`);
  if (args.includes("--open")) {
    const opened = openOfficialRuntimePage();
    if (opened.ok) process.stdout.write(`Opened: ${opened.url}\n`);
    else {
      process.stderr.write(`Could not open the browser automatically: ${opened.error}\nOpen this URL manually: ${opened.url}\n`);
      process.exitCode = 1;
    }
  }
}
