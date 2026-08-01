"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const workbenchRoot = path.resolve(argValue("--root", path.resolve(__dirname, "../../..")));
const knowledgeRoot = path.join(workbenchRoot, "knowledge-pack");

function toPosix(file) {
  return file.replace(/\\/g, "/");
}

function readJson(file, errors) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON: ${file} -> ${error.message}`);
    return null;
  }
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function listFilesRecursive(root) {
  const files = [];
  if (!fs.existsSync(root)) {
    return files;
  }
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
  }
  return files.sort((a, b) => toPosix(a).localeCompare(toPosix(b), "zh-Hans-CN"));
}

function rebuildManifest(manifestPath) {
  const entries = listFilesRecursive(knowledgeRoot)
    .filter((file) => path.resolve(file) !== path.resolve(manifestPath))
    .map((file) => {
      const buffer = fs.readFileSync(file);
      return {
        dest: toPosix(path.relative(knowledgeRoot, file)),
        bytes: buffer.length,
        sha256: sha256(buffer),
      };
    });
  const manifest = {
    schemaVersion: "2.0",
    purpose: "Integrity-only manifest for the portable clean knowledge pack.",
    entries,
    summary: {
      entryCount: entries.length,
      totalBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
    },
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function main() {
  const errors = [];
  const warnings = [];
  const info = [];

  if (!fs.existsSync(knowledgeRoot)) {
    errors.push(`knowledge-pack directory is missing: ${knowledgeRoot}`);
  }

  const manifestPath = path.join(knowledgeRoot, "MANIFEST.json");
  if (args.includes("--rebuild-manifest")) rebuildManifest(manifestPath);
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath, errors) : null;
  if (!manifest) {
    errors.push("knowledge-pack/MANIFEST.json is missing.");
  }

  if (manifest) {
    if (manifest.schemaVersion !== "2.0") {
      errors.push("MANIFEST schemaVersion must be 2.0.");
    }
    if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
      errors.push("MANIFEST entries must not be empty.");
    }

    const seenDest = new Set();
    const forbiddenDestPattern = /\.(pvf|bak|npk|img|zip|7z|rar|png|jpg|jpeg|webp|gif|docx|xlsx|pdf)$/i;
    const forbiddenDestSegments = /(^|\/)(clients?|materials?|research|evidence|experiments?|pvf-lab)(\/|$)/i;

    for (const entry of manifest.entries || []) {
      if (!entry.dest || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || !entry.sha256) {
        errors.push(`MANIFEST entry is missing required fields: ${JSON.stringify(entry)}`);
        continue;
      }
      const extraKeys = Object.keys(entry).filter((key) => !["dest", "bytes", "sha256"].includes(key));
      if (extraKeys.length > 0) errors.push(`MANIFEST entry has non-integrity metadata: ${entry.dest} (${extraKeys.join(", ")})`);
      if (path.isAbsolute(entry.dest) || entry.dest.includes("..")) {
        errors.push(`MANIFEST entry has unsafe dest: ${entry.dest}`);
      }
      if (seenDest.has(entry.dest)) {
        errors.push(`Duplicate MANIFEST dest: ${entry.dest}`);
      }
      seenDest.add(entry.dest);

      if (forbiddenDestPattern.test(entry.dest) || forbiddenDestSegments.test(entry.dest)) {
        errors.push(`Forbidden copied artifact in knowledge-pack: ${entry.dest}`);
      }

      const file = path.join(knowledgeRoot, entry.dest);
      if (!fs.existsSync(file)) {
        errors.push(`MANIFEST entry file is missing: ${entry.dest}`);
        continue;
      }
      const buffer = fs.readFileSync(file);
      if (buffer.length !== entry.bytes) {
        errors.push(`Byte size mismatch: ${entry.dest}`);
      }
      const actualHash = sha256(buffer);
      if (actualHash !== entry.sha256) {
        errors.push(`SHA-256 mismatch: ${entry.dest}`);
      }
      if (buffer.length > 5 * 1024 * 1024) {
        errors.push(`Knowledge-pack file is unexpectedly large: ${entry.dest}`);
      }
    }

    const expectedEntryCount = manifest.entries?.length || 0;
    const expectedTotalBytes = (manifest.entries || []).reduce((sum, entry) => sum + Number(entry.bytes || 0), 0);
    if (manifest.summary?.entryCount !== expectedEntryCount || manifest.summary?.totalBytes !== expectedTotalBytes) errors.push("MANIFEST summary does not match entries.");
  }

  const allFiles = listFilesRecursive(knowledgeRoot);
  const textFiles = allFiles.filter((file) => /\.(md|json|txt)$/i.test(file));
  for (const file of textFiles) {
    const rel = toPosix(path.relative(knowledgeRoot, file));
    const text = fs.readFileSync(file, "utf8");
    if (text.includes("\uFFFD")) {
      errors.push(`Unicode replacement character found in knowledge text: ${rel}`);
    }
    const suspiciousQuestionLines = text
      .split(/\r?\n/)
      .map((line, index) => ({ line, lineNumber: index + 1 }))
      .filter((item) => /\?{3,}/.test(item.line));
    if (suspiciousQuestionLines.length > 0) {
      errors.push(
        `Suspicious repeated question marks found in knowledge text: ${rel}:${suspiciousQuestionLines[0].lineNumber} (${suspiciousQuestionLines.length} line(s))`
      );
    }
    const forbiddenTerms = [
      ["retired-source-a", new RegExp("Gitee" + "Nut", "i")],
      ["retired-source-b", new RegExp("Xi" + "ti", "i")],
      ["retired-tool-layer-name", new RegExp("by" + "tool", "i")],
      ["retired-product-name", new RegExp("\\u5b87\\u5b99\\u9b54\\u65b9", "u")],
      ["historical-client-name-a", new RegExp("\\u6e05\\u98ce", "u")],
      ["historical-client-name-b", new RegExp("\\u5e7b\\u5883", "u")],
      ["historical-target-role", /主目标|辅助对照/],
      ["baseline-counter", new RegExp(["observed", "BaselineCount|compiled", "BaselineCount|rawReadbackVerified", "TargetCount"].join(""))],
      ["historical-evidence-route", new RegExp(["source", "-position|(?:^|[\\/-])led", "ger(?:[\\/.\\-]|$)|completion", "-audit"].join(""), "i")],
    ];
    for (const [id, pattern] of forbiddenTerms) if (pattern.test(text)) errors.push(`Semantic cleanliness violation (${id}): ${rel}`);
  }
  for (const file of allFiles) {
    const rel = toPosix(path.relative(knowledgeRoot, file));
    const historicalNamePattern = new RegExp(["(?:^|/)[^/]*(?:source", "-position|led", "ger|accept", "ance|completion", "-audit)[^/]*$"].join(""), "i");
    if (historicalNamePattern.test(rel)) errors.push(`Historical evidence artifact remains in knowledge-pack: ${rel}`);
  }
  const allowedGeneratedPrefixes = [
    "dictionaries/",
    "encyclopedia/",
    "safety/",
    "task-cards/"
  ];
  const allowedGeneratedFiles = new Set([
    "indexes/knowledge-index.json",
    "workflows/README.zh-CN.md",
    "workflows/npc-shop-edit.zh-CN.md",
    "workflows/skill-derivative-and-cancel.zh-CN.md"
  ]);
  const unmanagedGeneratedFiles = allFiles
    .map((file) => toPosix(path.relative(knowledgeRoot, file)))
    .filter((rel) => !["README.zh-CN.md", "EXPORT-POLICY.zh-CN.md", "MANIFEST.json", "workflows/README.md", "knowledge/README.md", "indexes/README.md", "health-check/README.md"].includes(rel))
    .filter((rel) => !allowedGeneratedFiles.has(rel))
    .filter((rel) => !allowedGeneratedPrefixes.some((prefix) => rel.startsWith(prefix)))
    .filter((rel) => manifest && !manifest.entries.some((entry) => entry.dest === rel));
  if (unmanagedGeneratedFiles.length > 0) {
    warnings.push(`Files not listed in MANIFEST: ${unmanagedGeneratedFiles.slice(0, 10).join(", ")}`);
  }

  info.push(`Knowledge root: ${knowledgeRoot}`);
  if (manifest) {
    info.push(`Manifest entries: ${manifest.entries?.length || 0}`);
    info.push(`Manifest bytes: ${manifest.summary?.totalBytes || 0}`);
  }

  for (const line of info) {
    console.log(`INFO ${line}`);
  }
  for (const line of warnings) {
    console.log(`WARN ${line}`);
  }
  for (const line of errors) {
    console.error(`ERROR ${line}`);
  }

  if (errors.length > 0) {
    console.error(`FAIL ${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exit(1);
  }

  console.log(`PASS 0 error(s), ${warnings.length} warning(s).`);
}

main();
