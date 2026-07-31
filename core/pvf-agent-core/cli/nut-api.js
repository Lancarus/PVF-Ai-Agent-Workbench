"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { runtimePath } = require("../lib/runtime-state");
const { loadPvfBackend } = require("../../../tools/pvf-bridge/native-backend");
const {
  appendClaims,
  assertExternalOutput,
  pathInside,
  readJson,
  safeId,
  sha256,
  sha256File,
  timestamp,
  writeJsonAtomic,
} = require("../lib/research-store");

const rawArgs = process.argv.slice(2);
const rootIndex = rawArgs.indexOf("--root");
const workbenchRoot = rootIndex >= 0 ? path.resolve(rawArgs[rootIndex + 1]) : path.resolve(__dirname, "../../..");
const args = rawArgs.filter((item, index) => item !== "--root" && rawArgs[index - 1] !== "--root");
const command = String(args[0] || "help").toLowerCase();

function option(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function options(name) {
  const values = [];
  for (let index = 0; index < args.length - 1; index += 1) {
    if (args[index] === name) values.push(args[index + 1]);
  }
  return values;
}

function flag(name) {
  return args.includes(name);
}

function required(name) {
  const value = option(name);
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function numberOption(name, fallback) {
  const value = option(name);
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${name} must be a positive integer.`);
  return number;
}

function usage() {
  return `Usage:
  workbench.bat nut-api build --source <declaration-directory> [--source-manifest <SOURCE-MANIFEST.json>] [--claim-store <CLAIM-STORE.json>] [--replace-claims] [--out <external-dir>] [--source-id nut-declarations] [--force]
  workbench.bat nut-api query --name <symbol> [--kind function|constant|class] [--group dnf|squirrel|frontend|tooling] [--observation <NUT-PVF-OBSERVATIONS.json>]... [--exact] [--limit 20]
  workbench.bat nut-api search --keyword <text> [--limit 20]
  workbench.bat nut-api stats
  workbench.bat nut-api compare-knowledge --catalog <NUT-API-CATALOG.json> [--out <external-dir>]
  workbench.bat nut-api observe-pvf --pvf <Script.pvf> [--label <text>] [--encoding Cn] [--out <external-dir>]
  workbench.bat nut-api compare-observations --observation <NUT-PVF-OBSERVATIONS.json> --observation <...> [--out <external-dir>]
  workbench.bat nut-api self-test

Queries use the Workbench-bundled compact facts by default. --catalog remains a maintenance-only override. Declarations describe a stated 3.0.7 environment; they do not prove that a target PVF runtime exposes the symbol.
`;
}

function toPosix(value) {
  return String(value || "").replace(/\\/g, "/");
}

function declarationGroup(relativePath) {
  const name = path.basename(relativePath).toLowerCase();
  if (name.startsWith("language.dof.")) return "dnf";
  if (name === "language.basic.nut" || name === "language.nut" || name.startsWith("language.library.") || name === "language.metamethod.nut") return "squirrel";
  if (name.startsWith("fe.")) return "frontend";
  return "tooling";
}

function cleanDocLine(line) {
  return line.replace(/^\s*\/\*\*?\s?/, "").replace(/\s*\*\/\s*$/, "").replace(/^\s*\*\s?/, "").trim();
}

function parseDocBlock(raw) {
  const result = { description: "", params: [], returns: null, tags: {} };
  const description = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = cleanDocLine(rawLine);
    if (!line || line === "/**" || line === "*/") continue;
    const param = line.match(/^@param\s+(?:\{([^}]+)\}\s*)?([^\s:-]+)?\s*(?:[-:]\s*)?(.*)$/i);
    if (param) {
      result.params.push({ type: param[1] || "any", name: param[2] || "", description: param[3] || "" });
      continue;
    }
    const returns = line.match(/^@returns?\s+(?:\{([^}]+)\}\s*)?(.*)$/i);
    if (returns) {
      result.returns = { type: returns[1] || "unknown", description: returns[2] || "" };
      continue;
    }
    const tag = line.match(/^@([A-Za-z][\w-]*)\s*(.*)$/);
    if (tag) {
      if (!result.tags[tag[1]]) result.tags[tag[1]] = [];
      result.tags[tag[1]].push(tag[2] || true);
      continue;
    }
    description.push(line);
  }
  result.description = description.join(" ").replace(/\s+/g, " ").trim();
  return result;
}

function countChar(line, character) {
  return [...line].filter((value) => value === character).length;
}

function signatureParams(raw, docs) {
  const byName = new Map((docs?.params || []).map((param) => [param.name, param]));
  return String(raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((name) => ({ name, type: byName.get(name)?.type || "unknown", description: byName.get(name)?.description || "" }));
}

function parseDeclarationFile(file, sourceRoot) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const relativePath = toPosix(path.relative(sourceRoot, file));
  const group = declarationGroup(relativePath);
  const lines = text.split(/\r?\n/);
  const declarations = [];
  const firstDocMatch = text.match(/\/\*\*[\s\S]*?\*\//);
  const firstDoc = firstDocMatch ? parseDocBlock(firstDocMatch[0]) : parseDocBlock("");
  let pendingDoc = null;
  let docLines = [];
  let inDoc = false;
  let braceDepth = 0;
  let currentClass = null;
  let classBodyDepth = null;
  let classAwaitingOpenBrace = false;
  let fileMetadata = {
    package: firstDoc.tags.package?.[0] || null,
    version: firstDoc.tags.version?.[0] || null,
    global: Boolean(firstDoc.tags.global),
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!inDoc && /\/\*\*/.test(line)) {
      inDoc = true;
      docLines = [line];
      if (/\*\//.test(line.slice(line.indexOf("/**") + 3))) {
        inDoc = false;
        pendingDoc = parseDocBlock(docLines.join("\n"));
      }
      continue;
    }
    if (inDoc) {
      docLines.push(line);
      if (/\*\//.test(line)) {
        inDoc = false;
        pendingDoc = parseDocBlock(docLines.join("\n"));
      }
      continue;
    }

    if (pendingDoc && declarations.length === 0) {
      fileMetadata = {
        package: pendingDoc.tags.package?.[0] || fileMetadata.package,
        version: pendingDoc.tags.version?.[0] || fileMetadata.version,
        global: Boolean(pendingDoc.tags.global) || fileMetadata.global,
      };
    }

    const classMatch = line.match(/^\s*class\s+([A-Za-z_][\w]*)(?:\s+extends\s+([A-Za-z_][\w.]*))?/);
    if (classMatch) {
      const docs = pendingDoc || parseDocBlock("");
      declarations.push({
        kind: "class",
        name: classMatch[1],
        qualifiedName: classMatch[1],
        className: null,
        extends: classMatch[2] || null,
        signature: `class ${classMatch[1]}${classMatch[2] ? ` extends ${classMatch[2]}` : ""}`,
        parameters: [],
        returns: null,
        description: docs.description,
        package: docs.tags.package?.[0] || fileMetadata.package,
        version: docs.tags.version?.[0] || fileMetadata.version,
        group,
        source: { relativePath, line: index + 1 },
      });
      currentClass = classMatch[1];
      classBodyDepth = null;
      classAwaitingOpenBrace = true;
      pendingDoc = null;
    }

    let functionSource = line;
    if (/\bfunction\s+[A-Za-z_]\w*\s*\(/.test(line) && !/\)/.test(line)) {
      for (let lookahead = index + 1; lookahead < Math.min(lines.length, index + 24); lookahead += 1) {
        functionSource += ` ${lines[lookahead].trim()}`;
        if (/\)/.test(lines[lookahead])) break;
      }
    }
    for (const match of functionSource.matchAll(/\bfunction\s+([A-Za-z_][\w]*)\s*\(([^)]*)\)/g)) {
      const docs = pendingDoc || parseDocBlock("");
      const name = match[1];
      const parameters = signatureParams(match[2], docs);
      declarations.push({
        kind: "function",
        name,
        qualifiedName: currentClass ? `${currentClass}.${name}` : name,
        className: currentClass,
        signature: `${currentClass ? `${currentClass}.` : ""}${name}(${parameters.map((param) => param.name).join(", ")})`,
        parameters,
        returns: docs.returns,
        description: docs.description,
        package: docs.tags.package?.[0] || fileMetadata.package,
        version: docs.tags.version?.[0] || fileMetadata.version,
        group,
        source: { relativePath, line: index + 1 },
      });
      pendingDoc = null;
    }

    const constantMatch = line.match(/^\s*([A-Za-z_][\w]*)\s*<-\s*(.+?)\s*;?\s*(?:\/\/.*)?$/);
    if (constantMatch && !/^\s*local\s/.test(line)) {
      const docs = pendingDoc || parseDocBlock("");
      const value = constantMatch[2].trim().slice(0, 300);
      declarations.push({
        kind: "constant",
        name: constantMatch[1],
        qualifiedName: currentClass ? `${currentClass}.${constantMatch[1]}` : constantMatch[1],
        className: currentClass,
        signature: `${constantMatch[1]} <- ${value}`,
        value,
        parameters: [],
        returns: null,
        description: docs.description,
        package: docs.tags.package?.[0] || fileMetadata.package,
        version: docs.tags.version?.[0] || fileMetadata.version,
        group,
        source: { relativePath, line: index + 1 },
      });
      pendingDoc = null;
    }

    const opens = countChar(line, "{");
    braceDepth += opens - countChar(line, "}");
    if (currentClass && classAwaitingOpenBrace && opens > 0) {
      classBodyDepth = braceDepth;
      classAwaitingOpenBrace = false;
    } else if (currentClass && !classAwaitingOpenBrace && classBodyDepth !== null && braceDepth < classBodyDepth) {
      currentClass = null;
      classBodyDepth = null;
      classAwaitingOpenBrace = false;
    }
    if (line.trim() && !line.trim().startsWith("//") && !classMatch && !/\bfunction\s+/.test(line) && !constantMatch && pendingDoc) {
      if (!/^\s*[{};,]\s*$/.test(line)) pendingDoc = null;
    }
  }

  return { relativePath, group, fileMetadata, declarations, sha256: sha256File(file) };
}

function extractMarkdownTutorial(file, sourceRoot) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const relativePath = toPosix(path.relative(sourceRoot, file));
  const headings = [];
  const mentions = new Map();
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^(#{1,4})\s+(.+)$/);
    if (heading) headings.push({ level: heading[1].length, title: heading[2].replace(/[*_`]/g, "").trim(), line: index + 1 });
    for (const match of lines[index].matchAll(/\b(?:sq_[A-Za-z_]\w*|[A-Z][A-Z0-9_]{3,}|[A-Za-z_]\w*\.[A-Za-z_]\w*)\b/g)) {
      const name = match[0];
      if (!mentions.has(name)) mentions.set(name, []);
      if (mentions.get(name).length < 8) mentions.get(name).push(index + 1);
    }
  }
  return {
    relativePath,
    sha256: sha256File(file),
    title: headings[0]?.title || path.basename(file, path.extname(file)),
    headings,
    mentions: [...mentions.entries()].map(([name, lineNumbers]) => ({ name, lineNumbers })),
  };
}

function findFiles(root, extension) {
  const results = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && path.extname(entry.name).toLowerCase() === extension) results.push(full);
    }
  }
  return results.sort((a, b) => toPosix(a).localeCompare(toPosix(b), "zh-Hans-CN"));
}

function uniqueCount(items, selector) {
  return new Set(items.map(selector)).size;
}

function conflictReport(declarations) {
  const groups = new Map();
  for (const item of declarations) {
    const key = `${item.kind}:${item.qualifiedName.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()]
    .filter(([, items]) => new Set(items.map((item) => item.signature)).size > 1)
    .map(([key, items]) => ({ key, signatures: [...new Set(items.map((item) => item.signature))], sources: items.map((item) => item.source) }));
}

function sourceManifestMap(file) {
  if (!file) return { manifest: null, byPath: new Map(), sha256: null };
  const manifest = readJson(path.resolve(file));
  return {
    manifest,
    byPath: new Map((manifest.files || []).map((item) => [item.relativePath, item])),
    sha256: sha256File(path.resolve(file)),
  };
}

function buildClaims(catalog, sourceId) {
  return catalog.declarations.map((item) => ({
    claimId: `nut-declaration.${item.kind}.${sha256(`${item.source.relativePath}:${item.source.line}:${item.qualifiedName}`).slice(0, 20)}`,
    domain: "nut-api",
    subjectType: item.kind,
    subject: item.qualifiedName,
    statement: item.description || item.signature,
    status: "candidate",
    sourceConfidence: item.group === "dnf" ? "anchor" : "candidate",
    versionApplicability: item.version ? "declared-version" : "unknown",
    distributionStatus: "local-research-only",
    sourceRefs: [{
      sourceId,
      relativePath: item.source.relativePath,
      locator: `line:${item.source.line}`,
      sourceFileSha256: item.source.fileSha256,
    }],
  }));
}

function build() {
  const sourceRoot = path.resolve(required("--source"));
  if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) throw new Error(`NUT declaration directory does not exist: ${sourceRoot}`);
  const sourceId = safeId(option("--source-id", "nut-declarations"));
  const outRoot = assertExternalOutput(workbenchRoot, option("--out", runtimePath(workbenchRoot, "nut-api-catalogs", sourceId, timestamp())));
  if (pathInside(sourceRoot, outRoot) || pathInside(outRoot, sourceRoot)) throw new Error("NUT catalog output and source must not overlap.");
  const catalogPath = path.join(outRoot, "NUT-API-CATALOG.json");
  if (fs.existsSync(catalogPath) && !flag("--force")) throw new Error(`Catalog already exists: ${catalogPath}`);

  const sourceManifest = sourceManifestMap(option("--source-manifest"));
  const declarationFiles = findFiles(path.join(sourceRoot, "资源nut函数声明"), ".nut");
  const tutorialFiles = findFiles(sourceRoot, ".md");
  const parsedFiles = declarationFiles.map((file) => parseDeclarationFile(file, sourceRoot));
  const declarations = parsedFiles.flatMap((item) => item.declarations.map((decl) => ({
    ...decl,
    source: { ...decl.source, fileSha256: item.sha256 },
  })));
  const tutorials = tutorialFiles.map((file) => extractMarkdownTutorial(file, sourceRoot));
  const mentionIndex = new Map();
  for (const tutorial of tutorials) {
    for (const mention of tutorial.mentions) {
      const key = mention.name.toLowerCase();
      if (!mentionIndex.has(key)) mentionIndex.set(key, []);
      mentionIndex.get(key).push({ relativePath: tutorial.relativePath, lineNumbers: mention.lineNumbers });
    }
  }
  for (const item of declarations) item.tutorialMentions = mentionIndex.get(item.name.toLowerCase()) || mentionIndex.get(item.qualifiedName.toLowerCase()) || [];

  const dnf = declarations.filter((item) => item.group === "dnf");
  const summary = {
    declarationFileCount: declarationFiles.length,
    tutorialFileCount: tutorialFiles.length,
    declarationCount: declarations.length,
    functionCount: declarations.filter((item) => item.kind === "function").length,
    constantCount: declarations.filter((item) => item.kind === "constant").length,
    classCount: declarations.filter((item) => item.kind === "class").length,
    uniqueFunctionNameCount: uniqueCount(declarations.filter((item) => item.kind === "function"), (item) => item.name.toLowerCase()),
    uniqueConstantNameCount: uniqueCount(declarations.filter((item) => item.kind === "constant"), (item) => item.name.toLowerCase()),
    dnfFunctionCount: dnf.filter((item) => item.kind === "function").length,
    dnfUniqueFunctionNameCount: uniqueCount(dnf.filter((item) => item.kind === "function"), (item) => item.name.toLowerCase()),
    dnfConstantCount: dnf.filter((item) => item.kind === "constant").length,
    dnfUniqueConstantNameCount: uniqueCount(dnf.filter((item) => item.kind === "constant"), (item) => item.name.toLowerCase()),
    conflictCount: 0,
  };
  const conflicts = conflictReport(declarations);
  summary.conflictCount = conflicts.length;
  const catalog = {
    schemaVersion: "1.0",
    phase: "external-nut-api-catalog",
    generatedAt: new Date().toISOString(),
    source: {
      sourceId,
      root: sourceRoot,
      declaredRuntimeVersion: "3.0.7",
      sourceManifestPath: option("--source-manifest") ? path.resolve(option("--source-manifest")) : null,
      sourceManifestSha256: sourceManifest.sha256,
      licenseStatus: "unknown",
      distributionStatus: "local-research-only",
    },
    parser: {
      id: "workbench-nut-declaration-parser",
      version: "1.0.0",
      sourceMethodsExecuted: false,
      sourceContentCopiedToWorkbench: false,
    },
    summary,
    declarationFiles: parsedFiles.map((item) => ({ relativePath: item.relativePath, sha256: item.sha256, group: item.group, metadata: item.fileMetadata, declarationCount: item.declarations.length })),
    declarations,
    tutorials,
    conflicts,
  };
  writeJsonAtomic(catalogPath, catalog);
  const catalogSha256 = sha256File(catalogPath);
  let claimsAdded = 0;
  const claimStorePath = option("--claim-store");
  if (claimStorePath) {
    const resolvedStore = assertExternalOutput(workbenchRoot, claimStorePath);
    const store = readJson(resolvedStore);
    const claims = buildClaims(catalog, sourceId);
    if (flag("--replace-claims")) {
      store.claims = (store.claims || []).filter((claim) => !String(claim.claimId || "").startsWith("nut-declaration."));
    }
    appendClaims(store, claims);
    writeJsonAtomic(resolvedStore, store);
    claimsAdded = claims.length;
  }
  process.stdout.write(`${JSON.stringify({ ok: true, command: "build", outRoot, catalogPath, catalogSha256, claimsAdded, summary }, null, 2)}\n`);
}

function loadCatalog() {
  const configured = option("--catalog", process.env.PVF_NUT_API_CATALOG || path.join(workbenchRoot, "knowledge-pack", "indexes", "nut-api-facts.compact.json"));
  const file = path.resolve(configured);
  if (!fs.existsSync(file)) throw new Error(`NUT API catalog does not exist: ${file}`);
  const catalog = readJson(file);
  if (!Array.isArray(catalog.declarations) || !["external-nut-api-catalog", "builtin-nut-api-facts"].includes(catalog.phase)) throw new Error(`Not a supported NUT API catalog: ${file}`);
  return { file, catalog };
}

function publicCatalogPath(file) {
  const relative = path.relative(workbenchRoot, file);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? `builtin:${toPosix(relative)}`
    : file;
}

function query() {
  const { file, catalog } = loadCatalog();
  const needle = required("--name").toLowerCase();
  const kind = option("--kind");
  const group = option("--group");
  const exact = flag("--exact");
  const limit = numberOption("--limit", 20);
  const matches = catalog.declarations.filter((item) => {
    if (kind && item.kind !== kind) return false;
    if (group && item.group !== group) return false;
    const names = [item.name, item.qualifiedName].map((value) => value.toLowerCase());
    return exact ? names.includes(needle) : names.some((value) => value.includes(needle));
  }).slice(0, limit);
  const observationMatches = options("--observation").map((value) => {
    const observationFile = path.resolve(value);
    const report = readJson(observationFile);
    const observed = (report.observed || []).filter((item) => item.name.toLowerCase() === needle || matches.some((match) => match.name.toLowerCase() === item.name.toLowerCase()));
    return {
      observationFile,
      label: report.pvf?.label,
      pvfSha256: report.pvf?.sha256,
      matches: observed,
    };
  });
  process.stdout.write(`${JSON.stringify({ ok: true, command: "query", catalog: publicCatalogPath(file), catalogKind: catalog.phase, declaredRuntimeVersion: catalog.declaredRuntimeVersion || catalog.source?.declaredRuntimeVersion, targetRuntimeVerified: false, notFoundProvesUnavailable: false, matchCount: matches.length, matches, observationMatches }, null, 2)}\n`);
}

function search() {
  const { file, catalog } = loadCatalog();
  const keyword = required("--keyword").toLowerCase();
  const limit = numberOption("--limit", 20);
  const matches = catalog.declarations.filter((item) => [item.name, item.qualifiedName, item.signature, item.description, item.package, item.version]
    .filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword))).slice(0, limit);
  process.stdout.write(`${JSON.stringify({ ok: true, command: "search", catalog: publicCatalogPath(file), catalogKind: catalog.phase, targetRuntimeVerified: false, matchCount: matches.length, matches }, null, 2)}\n`);
}

function stats() {
  const { file, catalog } = loadCatalog();
  process.stdout.write(`${JSON.stringify({ ok: true, command: "stats", catalog: publicCatalogPath(file), catalogKind: catalog.phase, catalogSha256: sha256File(file), declaredRuntimeVersion: catalog.declaredRuntimeVersion || catalog.source?.declaredRuntimeVersion, summary: catalog.summary }, null, 2)}\n`);
}

function containsIdentifier(text, name) {
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Za-z0-9_])${escaped}([^A-Za-z0-9_]|$)`, "i").test(text);
}

function compareKnowledge() {
  const { file, catalog } = loadCatalog();
  const knowledgeFiles = [
    "knowledge-pack/dictionaries/nut-runtime-api-boundary-quick.zh-CN.md",
    "knowledge-pack/dictionaries/nut-runtime-api-boundary.zh-CN.md",
    "knowledge-pack/indexes/skill-state-nut-runtime-api-group-boundary.zh-CN.md",
  ].map((relativePath) => ({
    relativePath,
    text: fs.existsSync(path.join(workbenchRoot, relativePath)) ? fs.readFileSync(path.join(workbenchRoot, relativePath), "utf8") : "",
  }));
  const combined = knowledgeFiles.map((item) => item.text).join("\n");
  const dnfFunctions = [...new Map(catalog.declarations.filter((item) => item.group === "dnf" && item.kind === "function").map((item) => [item.name.toLowerCase(), item.name])).values()];
  const dnfConstants = [...new Map(catalog.declarations.filter((item) => item.group === "dnf" && item.kind === "constant").map((item) => [item.name.toLowerCase(), item.name])).values()];
  const functionPresent = dnfFunctions.filter((name) => containsIdentifier(combined, name));
  const constantPresent = dnfConstants.filter((name) => containsIdentifier(combined, name));
  const report = {
    schemaVersion: "1.0",
    phase: "nut-api-clean-knowledge-coverage",
    generatedAt: new Date().toISOString(),
    catalog: file,
    catalogSha256: sha256File(file),
    knowledgeFiles: knowledgeFiles.map((item) => ({ relativePath: item.relativePath, bytes: Buffer.byteLength(item.text) })),
    summary: {
      dnfFunctionTotal: dnfFunctions.length,
      dnfFunctionPresent: functionPresent.length,
      dnfFunctionMissing: dnfFunctions.length - functionPresent.length,
      dnfConstantTotal: dnfConstants.length,
      dnfConstantPresent: constantPresent.length,
      dnfConstantMissing: dnfConstants.length - constantPresent.length,
    },
    functions: { present: functionPresent, missing: dnfFunctions.filter((name) => !functionPresent.includes(name)) },
    constants: { present: constantPresent, missing: dnfConstants.filter((name) => !constantPresent.includes(name)) },
  };
  const outRoot = assertExternalOutput(workbenchRoot, option("--out", runtimePath(workbenchRoot, "nut-api-coverage", timestamp())));
  const reportPath = path.join(outRoot, "NUT-API-KNOWLEDGE-COVERAGE.json");
  writeJsonAtomic(reportPath, report);
  process.stdout.write(`${JSON.stringify({ ok: true, command: "compare-knowledge", reportPath, reportSha256: sha256File(reportPath), summary: report.summary }, null, 2)}\n`);
}

function normalizeEncoding(value) {
  const raw = String(value || "Cn").toLowerCase();
  return ({ tw: "Tw", cn: "Cn", kr: "Kr", jp: "Jp", utf8: "Utf8", unicode: "Unicode" })[raw] || value;
}

function loadObservation(file) {
  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error(`NUT observation does not exist: ${resolved}`);
  const report = readJson(resolved);
  if (report.phase !== "nut-api-pvf-observation" || !report.pvf?.sha256 || !Array.isArray(report.observed)) {
    throw new Error(`Not a NUT PVF observation report: ${resolved}`);
  }
  return { file: resolved, fileSha256: sha256File(resolved), report };
}

function observationUsageIndex(report) {
  const index = new Map();
  for (const item of report.observed || []) {
    const key = String(item.name || "").toLowerCase();
    if (!key) continue;
    const usagePaths = [...new Set((item.locations || [])
      .filter((location) => location.kind === "usage")
      .map((location) => toPosix(location.pvfPath)))]
      .sort((a, b) => a.localeCompare(b));
    index.set(key, {
      name: item.name,
      usageCount: Number(item.usageCount || 0),
      definitionCount: Number(item.definitionCount || 0),
      usagePaths,
      declarations: item.declarations || [],
    });
  }
  return index;
}

function compareObservationPair(before, after) {
  const beforeIndex = observationUsageIndex(before.report);
  const afterIndex = observationUsageIndex(after.report);
  const keys = [...new Set([...beforeIndex.keys(), ...afterIndex.keys()])].sort((a, b) => a.localeCompare(b));
  const symbols = [];
  for (const key of keys) {
    const left = beforeIndex.get(key) || { name: afterIndex.get(key)?.name || key, usageCount: 0, definitionCount: 0, usagePaths: [], declarations: [] };
    const right = afterIndex.get(key) || { name: left.name, usageCount: 0, definitionCount: 0, usagePaths: [], declarations: [] };
    const addedUsagePaths = right.usagePaths.filter((value) => !left.usagePaths.includes(value));
    const removedUsagePaths = left.usagePaths.filter((value) => !right.usagePaths.includes(value));
    const usageDelta = right.usageCount - left.usageCount;
    const definitionDelta = right.definitionCount - left.definitionCount;
    if (usageDelta === 0 && definitionDelta === 0 && addedUsagePaths.length === 0 && removedUsagePaths.length === 0) continue;
    symbols.push({
      name: right.name || left.name,
      usageBefore: left.usageCount,
      usageAfter: right.usageCount,
      usageDelta,
      definitionBefore: left.definitionCount,
      definitionAfter: right.definitionCount,
      definitionDelta,
      addedUsagePaths,
      removedUsagePaths,
      declarations: right.declarations.length ? right.declarations : left.declarations,
    });
  }
  const addedUsedSymbols = symbols.filter((item) => item.usageBefore === 0 && item.usageAfter > 0).map((item) => item.name);
  const removedUsedSymbols = symbols.filter((item) => item.usageBefore > 0 && item.usageAfter === 0).map((item) => item.name);
  const usageCountChanged = symbols.filter((item) => item.usageDelta !== 0).map((item) => item.name);
  const usagePathChanged = symbols.filter((item) => item.addedUsagePaths.length || item.removedUsagePaths.length).map((item) => item.name);
  return {
    before: {
      label: before.report.pvf.label,
      pvfSha256: before.report.pvf.sha256,
      observationSha256: before.fileSha256,
    },
    after: {
      label: after.report.pvf.label,
      pvfSha256: after.report.pvf.sha256,
      observationSha256: after.fileSha256,
    },
    summary: {
      changedSymbolCount: symbols.length,
      addedUsedSymbolCount: addedUsedSymbols.length,
      removedUsedSymbolCount: removedUsedSymbols.length,
      usageCountChangedSymbolCount: usageCountChanged.length,
      usagePathChangedSymbolCount: usagePathChanged.length,
    },
    addedUsedSymbols,
    removedUsedSymbols,
    usageCountChanged,
    usagePathChanged,
    symbols,
  };
}

function compareObservations() {
  const configured = options("--observation");
  if (configured.length < 2) throw new Error("compare-observations requires at least two ordered --observation reports.");
  const observations = configured.map(loadObservation);
  const duplicatePvfs = observations
    .map((item) => item.report.pvf.sha256)
    .filter((sha, index, all) => all.indexOf(sha) !== index);
  if (duplicatePvfs.length) throw new Error(`Duplicate PVF SHA in observation sequence: ${[...new Set(duplicatePvfs)].join(", ")}`);
  const transitions = [];
  for (let index = 1; index < observations.length; index += 1) transitions.push(compareObservationPair(observations[index - 1], observations[index]));
  const report = {
    schemaVersion: "1.0",
    phase: "nut-api-pvf-observation-diff",
    generatedAt: new Date().toISOString(),
    safety: {
      readOnly: true,
      observationsAreIndexesNotFinalEvidence: true,
      missingUsageDoesNotProveRuntimeUnavailable: true,
      locationListsMayBeCappedByObservation: true,
    },
    sequence: observations.map((item) => ({
      label: item.report.pvf.label,
      pvfSha256: item.report.pvf.sha256,
      catalogSha256: item.report.catalogSha256,
      observationSha256: item.fileSha256,
      summary: item.report.summary,
    })),
    summary: {
      observationCount: observations.length,
      transitionCount: transitions.length,
      changedSymbolCountAcrossTransitions: new Set(transitions.flatMap((item) => item.symbols.map((symbol) => symbol.name.toLowerCase()))).size,
      transitionWithChangesCount: transitions.filter((item) => item.summary.changedSymbolCount > 0).length,
    },
    transitions,
  };
  const outRoot = assertExternalOutput(workbenchRoot, option("--out", runtimePath(workbenchRoot, "nut-api-observation-diffs", timestamp())));
  const reportPath = path.join(outRoot, "NUT-PVF-OBSERVATION-DIFF.json");
  if (fs.existsSync(reportPath) && !flag("--force")) throw new Error(`Observation diff already exists: ${reportPath}`);
  writeJsonAtomic(reportPath, report);
  process.stdout.write(`${JSON.stringify({ ok: true, command: "compare-observations", reportPath, reportSha256: sha256File(reportPath), summary: report.summary, transitions: transitions.map((item) => ({ before: item.before, after: item.after, summary: item.summary })) }, null, 2)}\n`);
}

async function observePvf() {
  const { file: catalogFile, catalog } = loadCatalog();
  const pvfPath = path.resolve(required("--pvf"));
  if (!fs.existsSync(pvfPath) || !fs.statSync(pvfPath).isFile()) throw new Error(`PVF does not exist: ${pvfPath}`);
  const label = option("--label", path.basename(path.dirname(pvfPath)) || path.basename(pvfPath));
  const outRoot = assertExternalOutput(workbenchRoot, option("--out", runtimePath(workbenchRoot, "nut-api-observations", safeId(label), timestamp())));
  const reportPath = path.join(outRoot, "NUT-PVF-OBSERVATIONS.json");
  if (fs.existsSync(reportPath) && !flag("--force")) throw new Error(`Observation report already exists: ${reportPath}`);
  const beforeSha256 = sha256File(pvfPath);
  const native = loadPvfBackend().api;
  const session = await native.openSession(pvfPath, normalizeEncoding(option("--encoding", "Cn")));
  const sessionId = session.sessionId || session;
  const symbolMap = new Map();
  for (const declaration of catalog.declarations.filter((item) => ["function", "constant"].includes(item.kind))) {
    const key = declaration.name.toLowerCase();
    if (!symbolMap.has(key)) symbolMap.set(key, { displayName: declaration.name, declarations: [] });
    symbolMap.get(key).declarations.push({ kind: declaration.kind, qualifiedName: declaration.qualifiedName, group: declaration.group });
  }
  const observations = new Map();
  const readErrors = [];
  let scriptFileCount = 0;
  try {
    const files = await native.listFiles(sessionId);
    const scripts = files
      .map((item) => toPosix(item.fileName))
      .filter((name) => /\.(nut|sqr)$/i.test(name));
    scriptFileCount = scripts.length;
    for (const [index, pvfFile] of scripts.entries()) {
      try {
        const read = await native.readFile(sessionId, pvfFile, {
          pvfEncoding: normalizeEncoding(option("--encoding", "Cn")),
          decompileScript: true,
          decompileBinaryAni: false,
          autoConvertStringLink: false,
          useCompatibleDecompiler: true,
          convertToSimplifiedChinese: false,
        });
        if (typeof read.textContent !== "string") continue;
        const lines = read.textContent.split(/\r?\n/);
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
          for (const match of lines[lineIndex].matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g)) {
            const key = match[0].toLowerCase();
            const symbol = symbolMap.get(key);
            if (!symbol) continue;
            if (!observations.has(key)) observations.set(key, { name: symbol.displayName, occurrenceCount: 0, definitionCount: 0, usageCount: 0, locations: [], declarations: symbol.declarations });
            const observed = observations.get(key);
            const escapedName = symbol.displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const definition = new RegExp(`\\bfunction\\s+${escapedName}\\s*\\(|^\\s*${escapedName}\\s*<-`, "i").test(lines[lineIndex]);
            observed.occurrenceCount += 1;
            if (definition) observed.definitionCount += 1;
            else observed.usageCount += 1;
            if (observed.locations.length < 40 && !observed.locations.some((item) => item.pvfPath === pvfFile && item.line === lineIndex + 1)) {
              observed.locations.push({ pvfPath: pvfFile, line: lineIndex + 1, kind: definition ? "definition" : "usage" });
            }
          }
        }
      } catch (error) {
        if (readErrors.length < 100) readErrors.push({ pvfPath: pvfFile, error: error.message });
      }
      if ((index + 1) % 500 === 0) process.stderr.write(`observe ${index + 1}/${scripts.length}\n`);
    }
  } finally {
    await native.closeSession(sessionId);
  }
  const afterSha256 = sha256File(pvfPath);
  if (beforeSha256 !== afterSha256) throw new Error("PVF changed during read-only observation.");
  const observed = [...observations.values()].sort((a, b) => a.name.localeCompare(b.name));
  const defined = observed.filter((item) => item.definitionCount > 0);
  const used = observed.filter((item) => item.usageCount > 0);
  const usedDnfFunctions = used.filter((item) => item.declarations.some((decl) => decl.group === "dnf" && decl.kind === "function"));
  const usedDnfConstants = used.filter((item) => item.declarations.some((decl) => decl.group === "dnf" && decl.kind === "constant"));
  const report = {
    schemaVersion: "1.0",
    phase: "nut-api-pvf-observation",
    generatedAt: new Date().toISOString(),
    catalog: catalogFile,
    catalogSha256: sha256File(catalogFile),
    pvf: { label, path: pvfPath, sha256: beforeSha256, encoding: normalizeEncoding(option("--encoding", "Cn")) },
    safety: { readOnly: true, pvfModified: false, generatedIndexIsFinalEvidence: false },
    summary: {
      scriptFileCount,
      observedSymbolCount: observed.length,
      definedSymbolCount: defined.length,
      usedSymbolCount: used.length,
      usedDnfFunctionNameCount: usedDnfFunctions.length,
      usedDnfConstantNameCount: usedDnfConstants.length,
      readErrorCount: readErrors.length,
    },
    observed,
    readErrors,
  };
  writeJsonAtomic(reportPath, report);
  process.stdout.write(`${JSON.stringify({ ok: true, command: "observe-pvf", reportPath, reportSha256: sha256File(reportPath), pvf: report.pvf, summary: report.summary }, null, 2)}\n`);
}

function selfTest() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pvf-nut-api-"));
  const checks = [];
  try {
    const builtin = readJson(path.join(workbenchRoot, "knowledge-pack", "indexes", "nut-api-facts.compact.json"));
    checks.push({ id: "builtin-catalog", ok: builtin.phase === "builtin-nut-api-facts" && builtin.declarations.length >= 3000 && builtin.declarations.some((item) => item.name === "sq_GetSkillLevel" && item.group === "dnf") });
    const source = path.join(tempRoot, "source");
    fs.mkdirSync(path.join(source, "资源nut函数声明"), { recursive: true });
    const declaration = path.join(source, "资源nut函数声明", "language.dof.fixture.nut");
    fs.writeFileSync(declaration, `/**\n * @package fixture\n * @version 3.0.7\n */\n/** Fixture function\n * @param {integer} value - input\n * @returns {boolean} ok\n */\nfunction sq_Fixture(value) {}\n/** Fixture constant */\nENUM_FIXTURE <- 7\nclass FixtureClass {\n  /** Method */\n  function getValue() {}\n}\n`, "utf8");
    const parsed = parseDeclarationFile(declaration, source);
    checks.push({ id: "global-function", ok: parsed.declarations.some((item) => item.qualifiedName === "sq_Fixture" && item.parameters[0]?.type === "integer") });
    checks.push({ id: "constant", ok: parsed.declarations.some((item) => item.name === "ENUM_FIXTURE" && item.value === "7") });
    checks.push({ id: "class-method", ok: parsed.declarations.some((item) => item.qualifiedName === "FixtureClass.getValue") });
    checks.push({ id: "declared-version", ok: parsed.declarations.every((item) => item.version === "3.0.7") });
    const before = {
      fileSha256: "a".repeat(64),
      report: { pvf: { label: "before", sha256: "1".repeat(64) }, observed: [
        { name: "sq_Fixture", usageCount: 1, definitionCount: 1, locations: [{ pvfPath: "a.nut", line: 1, kind: "usage" }], declarations: [] },
        { name: "ENUM_REMOVED", usageCount: 1, definitionCount: 0, locations: [{ pvfPath: "old.nut", line: 1, kind: "usage" }], declarations: [] },
      ] },
    };
    const after = {
      fileSha256: "b".repeat(64),
      report: { pvf: { label: "after", sha256: "2".repeat(64) }, observed: [
        { name: "sq_Fixture", usageCount: 2, definitionCount: 1, locations: [{ pvfPath: "b.nut", line: 2, kind: "usage" }], declarations: [] },
        { name: "ENUM_ADDED", usageCount: 1, definitionCount: 0, locations: [{ pvfPath: "new.nut", line: 1, kind: "usage" }], declarations: [] },
      ] },
    };
    const diff = compareObservationPair(before, after);
    checks.push({ id: "observation-added-symbol", ok: diff.addedUsedSymbols.includes("ENUM_ADDED") });
    checks.push({ id: "observation-removed-symbol", ok: diff.removedUsedSymbols.includes("ENUM_REMOVED") });
    checks.push({ id: "observation-usage-and-path-delta", ok: diff.symbols.some((item) => item.name === "sq_Fixture" && item.usageDelta === 1 && item.addedUsagePaths.includes("b.nut") && item.removedUsagePaths.includes("a.nut")) });
  } finally {
    if (!pathInside(os.tmpdir(), tempRoot)) throw new Error(`Unsafe NUT self-test path: ${tempRoot}`);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  const report = { schemaVersion: "1.0", phase: "nut-api-self-test", summary: { ok: checks.every((item) => item.ok), checkCount: checks.length, failedChecks: checks.filter((item) => !item.ok).length }, checks };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.summary.ok) process.exitCode = 1;
}

async function main() {
  if (command === "help" || command === "--help" || command === "-h") process.stdout.write(usage());
  else if (command === "build") build();
  else if (command === "query") query();
  else if (command === "search") search();
  else if (command === "stats") stats();
  else if (command === "compare-knowledge") compareKnowledge();
  else if (command === "observe-pvf") await observePvf();
  else if (command === "compare-observations") compareObservations();
  else if (command === "self-test") selfTest();
  else throw new Error(`Unknown nut-api command: ${command}\n\n${usage()}`);
}

main().catch((error) => {
  process.stderr.write(`ERROR ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
