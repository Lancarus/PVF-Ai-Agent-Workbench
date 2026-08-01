"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { runtimePath } = require("../lib/runtime-state");
const { loadPvfBackend } = require("../../../tools/pvf-bridge/native-backend");
const { assertExternalOutput, pathInside, readJson, safeId, sha256, sha256File, timestamp, writeJsonAtomic } = require("../lib/research-store");

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
  const result = [];
  for (let index = 0; index < args.length - 1; index += 1) if (args[index] === name) result.push(args[index + 1]);
  return result;
}

function flag(name) {
  return args.includes(name);
}

function required(name) {
  const value = option(name);
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function numberOption(name, fallback, max = 20000) {
  const raw = option(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`${name} must be an integer from 1 to ${max}.`);
  return value;
}

function usage() {
  return `Usage:
  workbench.bat pvf-lineage build --pvf <Script.pvf> --label <label> [--pvf <...> --label <...>] [--nut-observation <NUT-PVF-OBSERVATIONS.json>]... [--evidence <LINEAGE-EVIDENCE.json>] [--max-semantic-files 3000] [--encoding Cn] [--out <external-dir>] [--force]
  workbench.bat pvf-lineage query --catalog <PVF-LINEAGE-CATALOG.json> [--path <pvf-path> | --symbol <name> | --golden <id>] [--limit 50]
  workbench.bat pvf-lineage verify --catalog <PVF-LINEAGE-CATALOG.json> [--rehash-pvfs]
  workbench.bat pvf-lineage profile-check --catalog <PVF-LINEAGE-CATALOG.json> --profile <PRIVATE-REGRESSION-PROFILE.json>
  workbench.bat pvf-lineage stats --catalog <PVF-LINEAGE-CATALOG.json>
  workbench.bat pvf-lineage self-test

Versions are identified by full PVF SHA256. File manifests, indexes, evidence references, and reports stay outside the Workbench. Size-only file equality and generated indexes are never final evidence.
`;
}

function toPosix(value) {
  return String(value || "").replace(/\\/g, "/");
}

function normalizePvfPath(value) {
  return toPosix(value).replace(/^\/+/, "").toLowerCase();
}

function normalizeEncoding(value) {
  const raw = String(value || "Cn").toLowerCase();
  return ({ tw: "Tw", cn: "Cn", kr: "Kr", jp: "Jp", utf8: "Utf8", unicode: "Unicode" })[raw] || value;
}

function writeCompactJson(file, value) {
  const resolved = path.resolve(file);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const temporary = `${resolved}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporary, JSON.stringify(value), "utf8");
  fs.renameSync(temporary, resolved);
}

function readOptions(encoding) {
  return {
    pvfEncoding: encoding,
    decompileScript: true,
    decompileBinaryAni: false,
    autoConvertStringLink: false,
    useCompatibleDecompiler: true,
    convertToSimplifiedChinese: false,
  };
}

async function openSession(native, pvfPath, encoding) {
  const opened = await native.openSession(pvfPath, encoding);
  return opened.sessionId || opened;
}

async function readText(native, sessionId, pvfPath, encoding) {
  const result = await native.readFile(sessionId, pvfPath, readOptions(encoding));
  if (typeof result.textContent !== "string") throw new Error("PVF backend did not return textContent.");
  return result.textContent;
}

function fileMap(manifest) {
  return new Map((manifest.entries || []).map((item) => [normalizePvfPath(item[0]), { path: item[0], bytes: Number(item[1]), flags: Number(item[2] || 0) }]));
}

function computeFileTransition(before, after) {
  const left = fileMap(before);
  const right = fileMap(after);
  const added = [];
  const removed = [];
  const lengthChanged = [];
  let sameLengthUncheckedCount = 0;
  for (const [key, item] of right) {
    const previous = left.get(key);
    if (!previous) added.push(item.path);
    else if (previous.bytes !== item.bytes) lengthChanged.push({ path: item.path, bytesBefore: previous.bytes, bytesAfter: item.bytes });
    else sameLengthUncheckedCount += 1;
  }
  for (const [key, item] of left) if (!right.has(key)) removed.push(item.path);
  return {
    beforePvfSha256: before.pvf.sha256,
    afterPvfSha256: after.pvf.sha256,
    summary: { addedFileCount: added.length, removedFileCount: removed.length, lengthChangedFileCount: lengthChanged.length, sameLengthContentUncheckedCount: sameLengthUncheckedCount },
    added,
    removed,
    lengthChanged,
  };
}

function parseRegistryText(text) {
  const entries = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const match = line.match(/^\s*(-?\d+)\s+(?:`([^`]+)`|([^\s#;]+))/);
    if (!match) continue;
    entries.push({ id: Number(match[1]), targetPath: toPosix(match[2] || match[3] || ""), line: index + 1 });
  }
  return entries;
}

function parseNutText(text) {
  const functions = [];
  const constants = [];
  const calls = new Map();
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const match of line.matchAll(/\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) functions.push({ name: match[1], line: index + 1 });
    const constant = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*<-/);
    if (constant) constants.push({ name: constant[1], line: index + 1 });
    for (const match of line.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
      if (/\bfunction\s+$/.test(line.slice(0, match.index))) continue;
      calls.set(match[1], (calls.get(match[1]) || 0) + 1);
    }
  }
  return { functions, constants, calls: [...calls.entries()].map(([name, count]) => ({ name, count })) };
}

function parseTags(text) {
  const counts = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(\[[^\]\r\n]{1,160}\])/);
    if (!match) continue;
    const name = match[1].toLowerCase().replace(/\s+/g, " ");
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}

function extractTagNumbers(text, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`\\[${escaped}\\]([^\\r\\n]*)(?:\\r?\\n([^\\[]*))?`, "i"));
  if (!match) return [];
  const sameLine = [...String(match[1] || "").matchAll(/-?\d+(?:\.\d+)?/g)].map((item) => Number(item[0]));
  if (sameLine.length) return sameLine;
  return [...String(match[2] || "").matchAll(/-?\d+(?:\.\d+)?/g)].map((item) => Number(item[0]));
}

function inspectGolden(superArmorText, appendageText, registryIndex) {
  const maximum = extractTagNumbers(superArmorText || "", "maximum level")[0] ?? null;
  const growtypeMaximums = extractTagNumbers(superArmorText || "", "growtype maximum level");
  const maxGrowtype = growtypeMaximums.length ? Math.max(...growtypeMaximums) : null;
  const nut = parseNutText(appendageText || "");
  const symbol = "ActionClash_BerserkerTryBloodSwordDerivative";
  const resolveTargets = ["swordman/bloodsword.skl", "swordman/bloodswordex.skl", "swordman/superarmoroncast.skl"];
  const registryResolutions = [];
  for (const registry of registryIndex.files || []) {
    for (const entry of registry.entries || []) {
      if (resolveTargets.includes(normalizePvfPath(entry.targetPath))) registryResolutions.push({ registryPath: registry.path, ...entry });
    }
  }
  return {
    superArmorOnCast: {
      id: "superarmor-on-cast-level-cap",
      pvfPath: "skill/swordman/superarmoroncast.skl",
      maximumLevel: maximum,
      growtypeMaximumLevels: growtypeMaximums,
      maxGrowtypeMaximumLevel: maxGrowtype,
      crossFileConstraintDetected: maximum !== null && maxGrowtype !== null && maximum > maxGrowtype,
      conclusion: maximum !== null && maxGrowtype !== null && maximum > maxGrowtype ? "single-field-insufficient" : "unknown",
      fileTextSha256: superArmorText ? sha256(superArmorText) : null,
    },
    bloodSwordDerivative: {
      id: "blood-sword-tp-derivative",
      pvfPath: "sqr/character/swordman/appendage/ap_swordman_comminterrupt.nut",
      symbol,
      functionPresent: nut.functions.some((item) => item.name === symbol),
      functionDefinition: nut.functions.find((item) => item.name === symbol) || null,
      fileTextSha256: appendageText ? sha256(appendageText) : null,
      registryResolutions,
    },
  };
}

function aggregateSymbols(nutIndex, key) {
  const aggregate = new Map();
  for (const file of nutIndex.files || []) {
    for (const item of file[key] || []) aggregate.set(item.name, (aggregate.get(item.name) || 0) + Number(item.count || 1));
  }
  return aggregate;
}

function mapDelta(beforeMap, afterMap) {
  const added = [];
  const removed = [];
  const changed = [];
  for (const [name, count] of afterMap) {
    if (!beforeMap.has(name)) added.push({ name, count });
    else if (beforeMap.get(name) !== count) changed.push({ name, before: beforeMap.get(name), after: count, delta: count - beforeMap.get(name) });
  }
  for (const [name, count] of beforeMap) if (!afterMap.has(name)) removed.push({ name, count });
  return { added, removed, changed };
}

function diffRegistryIndexes(before, after) {
  const left = new Map((before.files || []).map((item) => [normalizePvfPath(item.path), item]));
  const right = new Map((after.files || []).map((item) => [normalizePvfPath(item.path), item]));
  const added = [];
  const removed = [];
  const changed = [];
  for (const [key, item] of right) {
    const previous = left.get(key);
    if (!previous) added.push(item.path);
    else if (previous.textSha256 !== item.textSha256) {
      const previousEntries = new Map((previous.entries || []).map((entry) => [`${entry.id}:${normalizePvfPath(entry.targetPath)}`, entry]));
      const currentEntries = new Map((item.entries || []).map((entry) => [`${entry.id}:${normalizePvfPath(entry.targetPath)}`, entry]));
      changed.push({
        path: item.path,
        beforeSha256: previous.textSha256,
        afterSha256: item.textSha256,
        addedEntries: [...currentEntries.entries()].filter(([entryKey]) => !previousEntries.has(entryKey)).map(([, entry]) => entry),
        removedEntries: [...previousEntries.entries()].filter(([entryKey]) => !currentEntries.has(entryKey)).map(([, entry]) => entry),
      });
    }
  }
  for (const [key, item] of left) if (!right.has(key)) removed.push(item.path);
  return { summary: { addedRegistryCount: added.length, removedRegistryCount: removed.length, changedRegistryCount: changed.length }, added, removed, changed };
}

function diffSemanticIndexes(before, after) {
  const left = new Map((before.files || []).map((item) => [normalizePvfPath(item.path), item]));
  const right = new Map((after.files || []).map((item) => [normalizePvfPath(item.path), item]));
  const changes = [];
  for (const [key, item] of right) {
    const previous = left.get(key);
    if (!previous || previous.textSha256 === item.textSha256) continue;
    const leftTags = new Map((previous.tags || []).map((tag) => [tag.name, tag.count]));
    const rightTags = new Map((item.tags || []).map((tag) => [tag.name, tag.count]));
    const delta = mapDelta(leftTags, rightTags);
    changes.push({ path: item.path, beforeSha256: previous.textSha256, afterSha256: item.textSha256, tags: delta });
  }
  return { summary: { changedSemanticFileCount: changes.length, indexedBefore: before.files?.length || 0, indexedAfter: after.files?.length || 0 }, changes };
}

function classifyGoldenTransitions(versions, evidence) {
  const superArmor = versions.map((version) => ({ pvfSha256: version.pvf.sha256, label: version.pvf.label, ...version.golden.superArmorOnCast }));
  const bloodSword = versions.map((version) => ({ pvfSha256: version.pvf.sha256, label: version.pvf.label, ...version.golden.bloodSwordDerivative }));
  const bloodStates = bloodSword.map((item, index) => {
    const previous = index > 0 ? bloodSword[index - 1] : null;
    let state = "unknown";
    if (item.functionPresent && (!previous || !previous.functionPresent)) state = "introduced";
    else if (!item.functionPresent && previous?.functionPresent) state = "removed";
    else if (item.functionPresent && previous?.functionPresent) state = item.fileTextSha256 === previous.fileTextSha256 ? "retained" : "changed";
    const pass = evidence.records.find((record) => record.type === "behavior-pass" && record.subject === item.symbol && record.pvfSha256.toLowerCase() === item.pvfSha256.toLowerCase());
    return { ...item, lineageState: pass ? "behavior-pass" : state, behaviorEvidenceId: pass?.id || null };
  });
  return { superArmorOnCast: superArmor, bloodSwordDerivative: bloodStates };
}

function loadEvidence(file) {
  if (!file) return { source: null, records: [] };
  const resolved = path.resolve(file);
  const input = readJson(resolved);
  const records = (input.records || []).map((record) => {
    const sourceFile = path.resolve(record.sourceFile);
    if (!fs.existsSync(sourceFile) || !fs.statSync(sourceFile).isFile()) throw new Error(`Evidence source file does not exist: ${sourceFile}`);
    return { ...record, sourceFile, sourceFileSha256: sha256File(sourceFile), sourceContentCopied: false, documentStatementSeparatedFromRuntimeFact: true };
  });
  return { source: { path: resolved, sha256: sha256File(resolved) }, records };
}

async function buildFileManifest(native, pvfPath, label, encoding, outRoot) {
  const beforeSha256 = sha256File(pvfPath);
  const sessionId = await openSession(native, pvfPath, encoding);
  let files;
  try {
    files = await native.listFiles(sessionId);
  } finally {
    await native.closeSession(sessionId);
  }
  if (sha256File(pvfPath) !== beforeSha256) throw new Error(`PVF changed during inventory: ${pvfPath}`);
  const entries = files.map((item) => [toPosix(item.fileName), Number(item.dataLength || 0), (item.isScriptFile ? 1 : 0) | (item.isBinaryAniFile ? 2 : 0)]).sort((a, b) => normalizePvfPath(a[0]).localeCompare(normalizePvfPath(b[0])));
  const manifest = { schemaVersion: "1.0", phase: "pvf-file-manifest", generatedAt: new Date().toISOString(), pvf: { label, path: pvfPath, sha256: beforeSha256, bytes: fs.statSync(pvfPath).size, encoding }, summary: { fileCount: entries.length, totalDataBytes: entries.reduce((sum, item) => sum + item[1], 0), contentHashCoverage: "pvf-container-sha-plus-path-length" }, entries };
  const manifestPath = path.join(outRoot, `PVF-FILE-MANIFEST-${beforeSha256.slice(0, 16)}.json`);
  writeCompactJson(manifestPath, manifest);
  return { manifest, manifestPath, manifestSha256: sha256File(manifestPath) };
}

async function scanVersion(native, fileManifest, selectedSemanticPaths, outRoot) {
  const { pvf, entries } = fileManifest;
  const manifestMap = fileMap(fileManifest);
  const sessionId = await openSession(native, pvf.path, pvf.encoding);
  const registries = [];
  const nuts = [];
  const semantics = [];
  const readErrors = [];
  const registryPaths = [...manifestMap.values()].filter((item) => /\.lst$/i.test(item.path)).map((item) => item.path);
  const nutPaths = [...manifestMap.values()].filter((item) => /\.(nut|sqr)$/i.test(item.path)).map((item) => item.path);
  const semanticPaths = selectedSemanticPaths.map((value) => manifestMap.get(normalizePvfPath(value))?.path).filter(Boolean);
  const readOne = async (pvfPath, kind) => {
    try {
      const text = await readText(native, sessionId, pvfPath, pvf.encoding);
      if (kind === "registry") registries.push({ path: pvfPath, textSha256: sha256(text), entries: parseRegistryText(text) });
      if (kind === "nut") nuts.push({ path: pvfPath, textSha256: sha256(text), ...parseNutText(text) });
      if (kind === "semantic") semantics.push({ path: pvfPath, textSha256: sha256(text), tags: parseTags(text) });
      return text;
    } catch (error) {
      if (readErrors.length < 500) readErrors.push({ path: pvfPath, kind, error: error.message });
      return "";
    }
  };
  try {
    for (const [index, pvfPath] of registryPaths.entries()) {
      await readOne(pvfPath, "registry");
      if ((index + 1) % 250 === 0) process.stderr.write(`${pvf.label} registry ${index + 1}/${registryPaths.length}\n`);
    }
    for (const [index, pvfPath] of nutPaths.entries()) {
      await readOne(pvfPath, "nut");
      if ((index + 1) % 100 === 0) process.stderr.write(`${pvf.label} nut ${index + 1}/${nutPaths.length}\n`);
    }
    for (const [index, pvfPath] of semanticPaths.entries()) {
      if (/\.(lst|nut|sqr)$/i.test(pvfPath)) continue;
      await readOne(pvfPath, "semantic");
      if ((index + 1) % 250 === 0) process.stderr.write(`${pvf.label} semantic ${index + 1}/${semanticPaths.length}\n`);
    }
    const superPath = manifestMap.get("skill/swordman/superarmoroncast.skl")?.path;
    const appendagePath = manifestMap.get("sqr/character/swordman/appendage/ap_swordman_comminterrupt.nut")?.path;
    const superText = superPath ? await readOne(superPath, "golden-superarmor") : "";
    const appendageText = appendagePath ? await readOne(appendagePath, "golden-appendage") : "";
    const registryIndex = { files: registries };
    const golden = inspectGolden(superText, appendageText, registryIndex);
    const registryPath = path.join(outRoot, `PVF-REGISTRY-INDEX-${pvf.sha256.slice(0, 16)}.json`);
    const nutPath = path.join(outRoot, `PVF-NUT-SEMANTIC-INDEX-${pvf.sha256.slice(0, 16)}.json`);
    const semanticPath = path.join(outRoot, `PVF-SECTION-INDEX-${pvf.sha256.slice(0, 16)}.json`);
    writeJsonAtomic(registryPath, { schemaVersion: "1.0", phase: "pvf-registry-semantic-index", pvf, files: registries, readErrors: readErrors.filter((item) => item.kind === "registry") });
    writeJsonAtomic(nutPath, { schemaVersion: "1.0", phase: "pvf-nut-semantic-index", pvf, files: nuts, readErrors: readErrors.filter((item) => item.kind === "nut") });
    writeJsonAtomic(semanticPath, { schemaVersion: "1.0", phase: "pvf-section-semantic-index", pvf, selectedPathCount: selectedSemanticPaths.length, files: semantics, readErrors: readErrors.filter((item) => item.kind === "semantic") });
    return {
      pvf,
      summary: { registryFileCount: registries.length, nutFileCount: nuts.length, semanticFileCount: semantics.length, readErrorCount: readErrors.length },
      registry: { path: registryPath, sha256: sha256File(registryPath) },
      nut: { path: nutPath, sha256: sha256File(nutPath) },
      semantic: { path: semanticPath, sha256: sha256File(semanticPath) },
      golden,
    };
  } finally {
    await native.closeSession(sessionId);
  }
}

async function build() {
  const pvfs = options("--pvf").map((value) => path.resolve(value));
  const labels = options("--label");
  if (pvfs.length < 2) throw new Error("build requires at least two ordered --pvf values.");
  if (labels.length !== pvfs.length) throw new Error("Provide one ordered --label for every --pvf.");
  for (const pvf of pvfs) if (!fs.existsSync(pvf) || !fs.statSync(pvf).isFile()) throw new Error(`PVF does not exist: ${pvf}`);
  const encoding = normalizeEncoding(option("--encoding", "Cn"));
  const outRoot = assertExternalOutput(workbenchRoot, option("--out", runtimePath(workbenchRoot, "pvf-lineage", timestamp())));
  for (const pvf of pvfs) if (pathInside(pvf, outRoot) || pathInside(outRoot, pvf)) throw new Error("Lineage output and source PVF must not overlap.");
  const catalogPath = path.join(outRoot, "PVF-LINEAGE-CATALOG.json");
  if (fs.existsSync(catalogPath) && !flag("--force")) throw new Error(`Lineage catalog already exists: ${catalogPath}`);
  const native = loadPvfBackend().api;
  const manifests = [];
  for (let index = 0; index < pvfs.length; index += 1) {
    process.stderr.write(`inventory ${index + 1}/${pvfs.length}: ${labels[index]}\n`);
    manifests.push(await buildFileManifest(native, pvfs[index], labels[index], encoding, outRoot));
  }
  const fileTransitions = [];
  const changedSemanticSet = new Set(["skill/swordman/superarmoroncast.skl", "sqr/character/swordman/appendage/ap_swordman_comminterrupt.nut"]);
  const semanticExtensions = /\.(skl|stk|equ|dgn|map|qst|mob|obj|act|atk|chr|etc|shp|npc|pet|ora|til|twn|wdm)$/i;
  for (let index = 1; index < manifests.length; index += 1) {
    const transition = computeFileTransition(manifests[index - 1].manifest, manifests[index].manifest);
    fileTransitions.push(transition);
    for (const pvfPath of [...transition.added, ...transition.removed, ...transition.lengthChanged.map((item) => item.path)]) if (semanticExtensions.test(pvfPath)) changedSemanticSet.add(normalizePvfPath(pvfPath));
  }
  const maxSemanticFiles = numberOption("--max-semantic-files", 3000);
  const selectedSemanticPaths = [...changedSemanticSet].sort((a, b) => a.localeCompare(b)).slice(0, maxSemanticFiles);
  const semanticSelectionTruncated = changedSemanticSet.size > selectedSemanticPaths.length;
  const versions = [];
  for (let index = 0; index < manifests.length; index += 1) {
    process.stderr.write(`semantic scan ${index + 1}/${manifests.length}: ${labels[index]}\n`);
    const scan = await scanVersion(native, manifests[index].manifest, selectedSemanticPaths, outRoot);
    versions.push({ ...scan, fileManifest: { path: manifests[index].manifestPath, sha256: manifests[index].manifestSha256, summary: manifests[index].manifest.summary } });
  }
  const transitions = [];
  for (let index = 1; index < versions.length; index += 1) {
    const beforeRegistry = readJson(versions[index - 1].registry.path);
    const afterRegistry = readJson(versions[index].registry.path);
    const beforeNut = readJson(versions[index - 1].nut.path);
    const afterNut = readJson(versions[index].nut.path);
    const beforeSemantic = readJson(versions[index - 1].semantic.path);
    const afterSemantic = readJson(versions[index].semantic.path);
    transitions.push({
      beforePvfSha256: versions[index - 1].pvf.sha256,
      afterPvfSha256: versions[index].pvf.sha256,
      files: fileTransitions[index - 1],
      registries: diffRegistryIndexes(beforeRegistry, afterRegistry),
      sections: diffSemanticIndexes(beforeSemantic, afterSemantic),
      nut: {
        functions: mapDelta(aggregateSymbols(beforeNut, "functions"), aggregateSymbols(afterNut, "functions")),
        constants: mapDelta(aggregateSymbols(beforeNut, "constants"), aggregateSymbols(afterNut, "constants")),
        calls: mapDelta(aggregateSymbols(beforeNut, "calls"), aggregateSymbols(afterNut, "calls")),
      },
    });
  }
  const evidence = loadEvidence(option("--evidence"));
  const providedNutObservations = options("--nut-observation").map((value) => {
    const resolved = path.resolve(value);
    const report = readJson(resolved);
    return { path: resolved, sha256: sha256File(resolved), pvfSha256: report.pvf?.sha256, label: report.pvf?.label, summary: report.summary };
  });
  const catalog = {
    schemaVersion: "1.0",
    phase: "pvf-semantic-lineage",
    generatedAt: new Date().toISOString(),
    safety: { readOnly: true, sourcePvfModified: false, fullShaIsVersionKey: true, sizeEqualityProvesContentEquality: false, generatedIndexesAreFinalEvidence: false, documentStatementsSeparatedFromBehaviorFacts: true },
    summary: { versionCount: versions.length, transitionCount: transitions.length, selectedSemanticPathCount: selectedSemanticPaths.length, semanticSelectionTruncated, evidenceRecordCount: evidence.records.length, nutObservationCount: providedNutObservations.length },
    versions,
    transitions,
    goldenCases: classifyGoldenTransitions(versions, evidence),
    evidence,
    nutObservations: providedNutObservations,
  };
  writeJsonAtomic(catalogPath, catalog);
  process.stdout.write(`${JSON.stringify({ ok: true, command: "build", catalogPath, catalogSha256: sha256File(catalogPath), summary: catalog.summary, versions: versions.map((item) => ({ label: item.pvf.label, sha256: item.pvf.sha256, ...item.summary })), goldenCases: catalog.goldenCases }, null, 2)}\n`);
}

function loadCatalog() {
  const configured = option("--catalog", process.env.PVF_LINEAGE_CATALOG || "");
  if (!configured) throw new Error("--catalog <PVF-LINEAGE-CATALOG.json> or PVF_LINEAGE_CATALOG is required.");
  const file = path.resolve(configured);
  if (!fs.existsSync(file)) throw new Error(`Lineage catalog does not exist: ${file}`);
  const catalog = readJson(file);
  if (catalog.phase !== "pvf-semantic-lineage") throw new Error(`Not a PVF lineage catalog: ${file}`);
  return { file, catalog };
}

function query() {
  const { file, catalog } = loadCatalog();
  const limit = numberOption("--limit", 50, 500);
  const requestedPath = option("--path");
  const symbol = option("--symbol");
  const golden = option("--golden");
  const result = {};
  if (golden) {
    const key = Object.keys(catalog.goldenCases || {}).find((item) => item.toLowerCase() === golden.toLowerCase() || (catalog.goldenCases[item] || []).some((entry) => entry.id === golden));
    result.golden = key ? { id: key, records: catalog.goldenCases[key] } : null;
  }
  if (requestedPath) {
    const needle = normalizePvfPath(requestedPath);
    result.path = catalog.transitions.flatMap((transition) => {
      const fileHits = [...(transition.files.added || []).map((value) => ({ state: "introduced", path: value })), ...(transition.files.removed || []).map((value) => ({ state: "removed", path: value })), ...(transition.files.lengthChanged || []).map((value) => ({ state: "changed", ...value }))].filter((item) => normalizePvfPath(item.path).includes(needle));
      const registryHits = (transition.registries.changed || []).filter((item) => normalizePvfPath(item.path).includes(needle));
      const sectionHits = (transition.sections.changes || []).filter((item) => normalizePvfPath(item.path).includes(needle));
      return fileHits.length || registryHits.length || sectionHits.length ? [{ beforePvfSha256: transition.beforePvfSha256, afterPvfSha256: transition.afterPvfSha256, fileHits, registryHits, sectionHits }] : [];
    }).slice(0, limit);
  }
  if (symbol) {
    const lower = symbol.toLowerCase();
    result.symbol = catalog.transitions.map((transition) => ({
      beforePvfSha256: transition.beforePvfSha256,
      afterPvfSha256: transition.afterPvfSha256,
      functions: [...transition.nut.functions.added, ...transition.nut.functions.removed, ...transition.nut.functions.changed].filter((item) => item.name.toLowerCase().includes(lower)),
      constants: [...transition.nut.constants.added, ...transition.nut.constants.removed, ...transition.nut.constants.changed].filter((item) => item.name.toLowerCase().includes(lower)),
      calls: [...transition.nut.calls.added, ...transition.nut.calls.removed, ...transition.nut.calls.changed].filter((item) => item.name.toLowerCase().includes(lower)),
    })).filter((item) => item.functions.length || item.constants.length || item.calls.length).slice(0, limit);
  }
  process.stdout.write(`${JSON.stringify({ ok: true, command: "query", catalog: file, catalogSha256: sha256File(file), generatedIndexesAreFinalEvidence: false, result }, null, 2)}\n`);
}

function stats() {
  const { file, catalog } = loadCatalog();
  process.stdout.write(`${JSON.stringify({ ok: true, command: "stats", catalog: file, catalogSha256: sha256File(file), summary: catalog.summary, versions: catalog.versions.map((item) => ({ pvf: item.pvf, summary: item.summary })), safety: catalog.safety }, null, 2)}\n`);
}

function verify() {
  const { file, catalog } = loadCatalog();
  const checks = [];
  for (const version of catalog.versions || []) {
    for (const index of [version.fileManifest, version.registry, version.nut, version.semantic]) checks.push({ type: "index", path: index.path, expectedSha256: index.sha256, actualSha256: fs.existsSync(index.path) ? sha256File(index.path) : null, ok: fs.existsSync(index.path) && sha256File(index.path) === index.sha256 });
    if (flag("--rehash-pvfs")) checks.push({ type: "pvf", path: version.pvf.path, expectedSha256: version.pvf.sha256, actualSha256: fs.existsSync(version.pvf.path) ? sha256File(version.pvf.path) : null, ok: fs.existsSync(version.pvf.path) && sha256File(version.pvf.path) === version.pvf.sha256 });
  }
  const summary = { ok: checks.every((item) => item.ok), checkCount: checks.length, failedChecks: checks.filter((item) => !item.ok).length, pvfsRehashed: flag("--rehash-pvfs") };
  process.stdout.write(`${JSON.stringify({ ok: summary.ok, command: "verify", catalog: file, summary, checks }, null, 2)}\n`);
  if (!summary.ok) process.exitCode = 1;
}

function profileCheck() {
  const { file, catalog } = loadCatalog();
  const profileFile = path.resolve(required("--profile"));
  const profile = readJson(profileFile);
  const catalogSha256 = sha256File(file);
  const checks = [];
  checks.push({ id: "catalog-sha", ok: !profile.catalogSha256 || profile.catalogSha256 === catalogSha256, expected: profile.catalogSha256 || null, actual: catalogSha256 });
  const knownPvfs = new Set((catalog.versions || []).map((item) => item.pvf.sha256.toLowerCase()));
  for (const sha of profile.pvfSha256 || []) checks.push({ id: `pvf:${sha.slice(0, 12)}`, ok: knownPvfs.has(sha.toLowerCase()), expected: sha });
  for (const request of profile.checks || []) {
    if (request.type === "path") {
      const byVersion = [];
      for (const version of catalog.versions || []) {
        const manifest = readJson(version.fileManifest.path);
        byVersion.push({ pvfSha256: version.pvf.sha256, present: fileMap(manifest).has(normalizePvfPath(request.value)) });
      }
      const expected = request.expectedPresent !== false;
      checks.push({ id: request.id, type: request.type, value: request.value, ok: byVersion.every((item) => item.present === expected), byVersion });
    } else if (request.type === "symbol") {
      const byVersion = [];
      for (const version of catalog.versions || []) {
        const nut = readJson(version.nut.path);
        const present = (nut.files || []).some((item) => [...(item.functions || []), ...(item.constants || []), ...(item.calls || [])].some((symbol) => symbol.name === request.value));
        byVersion.push({ pvfSha256: version.pvf.sha256, present });
      }
      const expectedBySha = request.expectedBySha || {};
      checks.push({ id: request.id, type: request.type, value: request.value, ok: byVersion.every((item) => expectedBySha[item.pvfSha256] === undefined || Boolean(expectedBySha[item.pvfSha256]) === item.present), byVersion });
    } else if (request.type === "golden-state") {
      const records = catalog.goldenCases?.[request.value] || [];
      const expectedBySha = request.expectedBySha || {};
      checks.push({ id: request.id, type: request.type, value: request.value, ok: Object.entries(expectedBySha).every(([sha, expected]) => records.some((item) => item.pvfSha256 === sha && (item.lineageState || item.conclusion) === expected)), records });
    } else {
      checks.push({ id: request.id || "unknown", type: request.type, ok: false, error: "Unsupported profile check type." });
    }
  }
  const summary = { ok: checks.every((item) => item.ok), checkCount: checks.length, failedChecks: checks.filter((item) => !item.ok).length };
  process.stdout.write(`${JSON.stringify({ ok: summary.ok, command: "profile-check", catalog: file, profile: profileFile, profileSha256: sha256File(profileFile), summary, checks }, null, 2)}\n`);
  if (!summary.ok) process.exitCode = 1;
}

function selfTest() {
  const checks = [];
  const before = { pvf: { sha256: "1".repeat(64) }, entries: [["a.skl", 10, 1], ["old.skl", 2, 1]] };
  const after = { pvf: { sha256: "2".repeat(64) }, entries: [["a.skl", 12, 1], ["new.skl", 2, 1]] };
  const files = computeFileTransition(before, after);
  checks.push({ id: "file-states", ok: files.added.includes("new.skl") && files.removed.includes("old.skl") && files.lengthChanged[0]?.path === "a.skl" });
  const registry = parseRegistryText("103 `Swordman/BloodSword.skl`\n168 `Swordman/BloodSwordEx.skl`");
  checks.push({ id: "registry-parse", ok: registry.length === 2 && registry[1].id === 168 });
  const nut = parseNutText("CONST_A <- 1\nfunction ActionClash_BerserkerTryBloodSwordDerivative(obj) { helper(obj); }");
  checks.push({ id: "nut-semantics", ok: nut.constants[0]?.name === "CONST_A" && nut.functions[0]?.name === "ActionClash_BerserkerTryBloodSwordDerivative" && nut.calls.some((item) => item.name === "helper") });
  const golden = inspectGolden("[maximum level] 20\n[growtype maximum level] 10 10 10 10 10 10", "function ActionClash_BerserkerTryBloodSwordDerivative(obj) {}", { files: [{ path: "skill/swordman/swordmanskill.lst", entries: registry }] });
  checks.push({ id: "cross-file-constraint", ok: golden.superArmorOnCast.crossFileConstraintDetected && golden.superArmorOnCast.conclusion === "single-field-insufficient" });
  checks.push({ id: "golden-symbol", ok: golden.bloodSwordDerivative.functionPresent && golden.bloodSwordDerivative.registryResolutions.length === 2 });
  const report = { schemaVersion: "1.0", phase: "pvf-lineage-self-test", summary: { ok: checks.every((item) => item.ok), checkCount: checks.length, failedChecks: checks.filter((item) => !item.ok).length }, checks };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.summary.ok) process.exitCode = 1;
}

async function main() {
  if (["help", "--help", "-h"].includes(command)) process.stdout.write(usage());
  else if (command === "build") await build();
  else if (command === "query") query();
  else if (command === "verify") verify();
  else if (command === "profile-check") profileCheck();
  else if (command === "stats") stats();
  else if (command === "self-test") selfTest();
  else throw new Error(`Unknown pvf-lineage command: ${command}\n\n${usage()}`);
}

main().catch((error) => {
  process.stderr.write(`ERROR ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
