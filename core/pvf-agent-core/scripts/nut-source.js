"use strict";

const fs = require("fs");
const path = require("path");
const { runtimePath } = require("../lib/runtime-state");
const { timestamp, toPosix, writeJson } = require("../lib/release-utils");

const rawArgs = process.argv.slice(2);
const rootIndex = rawArgs.indexOf("--root");
const workbenchRoot = rootIndex >= 0 && rawArgs[rootIndex + 1]
  ? path.resolve(rawArgs[rootIndex + 1])
  : path.resolve(__dirname, "../../..");
const args = rawArgs.filter((item, index) => !(item === "--root" || rawArgs[index - 1] === "--root"));
const command = args[0] || "help";

function option(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function usage() {
  return `Usage:
  workbench.bat nut-source scan --source <file-or-directory> [--out <dir>] [--max-symbols 200] [--max-headings 200]

The scan is read-only. It writes a source-clue report outside the Workbench by default and does not copy tutorial text into knowledge-pack.
`;
}

function safeLimit(name, fallback) {
  const value = Number.parseInt(option(name, String(fallback)), 10);
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.min(value, 5000);
}

function listSourceFiles(source) {
  const resolved = path.resolve(source);
  const stat = fs.statSync(resolved);
  if (stat.isFile()) return { sourceRoot: path.dirname(resolved), files: [resolved], sourceKind: "file" };
  if (!stat.isDirectory()) throw new Error(`Source is not a file or directory: ${source}`);
  const files = [];
  const stack = [resolved];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && /\.(md|nut)$/i.test(entry.name)) {
        files.push(full);
      }
    }
  }
  return {
    sourceRoot: resolved,
    files: files.sort((a, b) => toPosix(a).localeCompare(toPosix(b), "zh-Hans-CN")),
    sourceKind: "directory",
  };
}

function rel(sourceRoot, file) {
  return toPosix(path.relative(sourceRoot, file));
}

function addMap(map, key, file, lineNumber) {
  if (!key) return;
  const current = map.get(key) || { symbol: key, count: 0, files: new Map() };
  current.count += 1;
  const fileLines = current.files.get(file) || [];
  if (lineNumber && fileLines.length < 8) fileLines.push(lineNumber);
  current.files.set(file, fileLines);
  map.set(key, current);
}

function mergeFileSet(target, file) {
  if (target.files.length < 12 && !target.files.includes(file)) target.files.push(file);
}

function bucketIncrement(buckets, id, file, count = 1) {
  const bucket = buckets.get(id) || { id, count: 0, files: [] };
  bucket.count += count;
  mergeFileSet(bucket, file);
  buckets.set(id, bucket);
}

function classifyFamily(relPath) {
  const name = path.basename(relPath).toLowerCase();
  if (!/\.nut$/i.test(name)) return "tutorial-markdown";
  if (name.startsWith("language.dof.")) return "dof-runtime-stub";
  if (name.startsWith("language.library.") || name === "language.nut" || name.startsWith("language.")) return "squirrel-language-stub";
  if (name.startsWith("fe.")) return "front-end-fe-stub";
  if (name === "dp-s.class.nut" || name.startsWith("docblock.")) return "editor-language-stub";
  return "other-nut-stub";
}

function classifyTopic(line) {
  const value = line.toLowerCase();
  const defs = [
    ["skill-state", /skill|state|substate|技能|状态/],
    ["buff-appendage", /buff|appendage|apd|附加|主动|被动/],
    ["passiveobject", /passiveobject|passive object|\bpo\b|被动对象/],
    ["attack-damage", /attack|damage|atk|伤害|攻击/],
    ["data-transfer", /write|read|vector|packet|数据|传输/],
    ["motion-animation", /motion|ani|animation|frame|动作|动画|帧/],
    ["movement-grab-camera", /move|grab|camera|throw|移动|抓取|镜头/],
    ["debug-hotload", /dofile|sq_runscript|debug|调试|热加载/],
    ["ui-client", /\bui\b|draw|img|npk|image|客户端|绘制|图标/],
    ["api-symbol", /api|function|class|函数|声明|常量/],
  ];
  return defs.filter(([, pattern]) => pattern.test(value)).map(([id]) => id);
}

function symbolCategories(symbol) {
  const categories = [];
  const lower = symbol.toLowerCase();
  if (symbol === "dofile" || symbol === "loadfile" || symbol === "sq_RunScript" || symbol === "writeclosuretofile" || lower === "file") {
    categories.push("debug-or-io-risk");
  }
  if (/pushState|pushPassiveObj|load_state/i.test(symbol)) categories.push("load-state-entry");
  if (/sq_AddSetStatePacket|sq_IntVect|sq_GetVectorData|substate/i.test(symbol)) categories.push("state-vector");
  if (/sq_StartWrite|sq_Write|readDword|readWord|readByte|receiveData|reciveData/i.test(symbol)) categories.push("data-transfer");
  if (/Appendage|appendage|BUFF|Buff|sq_AddFunctionName|sq_AddChangeStatus/i.test(symbol)) categories.push("buff-appendage");
  if (/PassiveObject|passiveobject|SendCreatePassiveObject|AttackInfo|ATK/i.test(symbol)) categories.push("passiveobject-attack");
  if (/sq_|CNSquirrel|CNRD|IRDSQR|IRD|CNFlash|sq_/i.test(symbol)) categories.push("dof-api-candidate");
  if (categories.length === 0) categories.push("general-squirrel-or-tutorial");
  return categories;
}

function extractBacktickSymbols(text, map, file) {
  const regex = /`([^`\r\n]{1,120})`/g;
  let match;
  while ((match = regex.exec(text))) {
    const value = match[1].trim();
    if (/^[A-Za-z_][A-Za-z0-9_.:]*$/.test(value)) addMap(map, value.replace(/::/g, "."), file, null);
  }
}

function extractDeclarations(text, file, family, declarations, symbols) {
  let currentClass = null;
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    const classMatch = line.match(/^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (classMatch) {
      currentClass = classMatch[1];
      const key = classMatch[1];
      addMap(declarations.classes, key, file, lineNumber);
      addMap(symbols, key, file, lineNumber);
    }
    const functionRegex = /\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
    let functionMatch;
    while ((functionMatch = functionRegex.exec(line))) {
      const name = functionMatch[1];
      const qualified = family.endsWith("stub") && currentClass && /^\s*function\b/.test(line)
        ? `${currentClass}.${name}`
        : name;
      addMap(declarations.functions, qualified, file, lineNumber);
      addMap(symbols, qualified, file, lineNumber);
      addMap(symbols, name, file, lineNumber);
    }
    const assignRegex = /\b([A-Z][A-Z0-9_]{2,})\b\s*(?:<-|=)/g;
    let assignMatch;
    while ((assignMatch = assignRegex.exec(line))) {
      addMap(declarations.constants, assignMatch[1], file, lineNumber);
      addMap(symbols, assignMatch[1], file, lineNumber);
    }
  }
}

function extractCalls(text, file, symbols) {
  const regex = /\b([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)\s*\(/g;
  let match;
  while ((match = regex.exec(text))) {
    const symbol = match[1];
    if (
      symbol.includes("sq_") ||
      /^sq_/i.test(symbol) ||
      /^(CNSquirrel|CNRD|IRDSQR|IRD|CNFlash)/.test(symbol) ||
      /^(dofile|loadfile|sq_RunScript|writeclosuretofile)$/.test(symbol) ||
      /PassiveObject|Appendage|AttackInfo|BUFF|Buff/.test(symbol)
    ) {
      const before = text.slice(0, match.index);
      const lineNumber = before.split(/\r?\n/).length;
      addMap(symbols, symbol, file, lineNumber);
    }
  }
}

function compactMap(map, maxItems) {
  return [...map.values()]
    .sort((a, b) => b.count - a.count || a.symbol.localeCompare(b.symbol))
    .slice(0, maxItems)
    .map((item) => ({
      symbol: item.symbol,
      count: item.count,
      categories: symbolCategories(item.symbol),
      files: [...item.files.entries()].slice(0, 12).map(([file, lines]) => ({ file, lines })),
    }));
}

function extractBoundarySymbols(workbenchRoot) {
  const files = [
    "knowledge-pack/dictionaries/nut-runtime-api-boundary-quick.zh-CN.md",
    "knowledge-pack/dictionaries/nut-runtime-api-boundary.zh-CN.md",
  ];
  const result = {};
  for (const relPath of files) {
    const file = path.join(workbenchRoot, relPath);
    const symbols = new Set();
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, "utf8");
      const regex = /`([^`\r\n]{1,120})`/g;
      let match;
      while ((match = regex.exec(text))) {
        const value = match[1].trim();
        if (/^[A-Za-z_][A-Za-z0-9_.:]*$/.test(value)) symbols.add(value.replace(/::/g, "."));
      }
    }
    result[relPath] = symbols;
  }
  return result;
}

function scanSource(source, maxSymbols, maxHeadings) {
  const { sourceRoot, files, sourceKind } = listSourceFiles(source);
  const declarations = { classes: new Map(), functions: new Map(), constants: new Map() };
  const candidateSymbols = new Map();
  const backtickSymbols = new Map();
  const topicBuckets = new Map();
  const riskBuckets = new Map();
  const familyBuckets = new Map();
  const headings = [];
  const fileSummaries = [];
  let totalBytes = 0;
  let totalLines = 0;

  for (const file of files) {
    const relPath = rel(sourceRoot, file);
    const family = classifyFamily(relPath);
    const buffer = fs.readFileSync(file);
    const text = buffer.toString("utf8");
    const lines = text.split(/\r?\n/);
    totalBytes += buffer.length;
    totalLines += lines.length;
    bucketIncrement(familyBuckets, family, relPath);

    const fileSummary = {
      file: relPath,
      family,
      bytes: buffer.length,
      lines: lines.length,
      headingCount: 0,
      classCount: 0,
      functionDeclarationCount: 0,
      constantDeclarationCount: 0,
    };

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);
      if (headingMatch) {
        const title = headingMatch[2].replace(/[`*_#]/g, "").trim();
        fileSummary.headingCount += 1;
        if (headings.length < maxHeadings) {
          headings.push({ file: relPath, line: index + 1, level: headingMatch[1].length, title });
        }
        for (const topic of classifyTopic(title)) bucketIncrement(topicBuckets, topic, relPath);
      }
      for (const topic of classifyTopic(line)) bucketIncrement(topicBuckets, topic, relPath, 0);
      if (/\b(dofile|loadfile|sq_RunScript|writeclosuretofile)\b/.test(line)) bucketIncrement(riskBuckets, "debug-hotload-or-io", relPath);
      if (/\b(file|blob)\s*\(/.test(line)) bucketIncrement(riskBuckets, "local-file-io", relPath);
      if (/\b(APID|BUFF|SKILL|STATE)_[A-Z0-9_]+/.test(line)) bucketIncrement(riskBuckets, "bare-constant-id", relPath);
      if (/\b\d{3,}\b/.test(line) && /(skill|state|apid|buff|passive|object|po|技能|状态|被动)/i.test(line)) {
        bucketIncrement(riskBuckets, "numeric-id-source-clue", relPath);
      }
    }

    const beforeClass = declarations.classes.size;
    const beforeFunctions = declarations.functions.size;
    const beforeConstants = declarations.constants.size;
    extractDeclarations(text, relPath, family, declarations, candidateSymbols);
    extractCalls(text, relPath, candidateSymbols);
    extractBacktickSymbols(text, backtickSymbols, relPath);
    fileSummary.classCount = declarations.classes.size - beforeClass;
    fileSummary.functionDeclarationCount = declarations.functions.size - beforeFunctions;
    fileSummary.constantDeclarationCount = declarations.constants.size - beforeConstants;
    fileSummaries.push(fileSummary);
  }

  const boundary = extractBoundarySymbols(workbenchRoot);
  const quick = boundary["knowledge-pack/dictionaries/nut-runtime-api-boundary-quick.zh-CN.md"];
  const full = boundary["knowledge-pack/dictionaries/nut-runtime-api-boundary.zh-CN.md"];
  const allCandidates = new Set([...candidateSymbols.keys(), ...backtickSymbols.keys()]);
  const missingFromQuick = [...allCandidates]
    .filter((symbol) => !quick.has(symbol))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, maxSymbols);
  const missingFromFull = [...allCandidates]
    .filter((symbol) => !full.has(symbol))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, maxSymbols);

  const familyCounts = [...familyBuckets.values()].sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  const topics = [...topicBuckets.values()].sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  const risks = [...riskBuckets.values()].sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

  return {
    sourceKind,
    sourceRootName: path.basename(sourceRoot),
    absoluteSourcePathRecorded: false,
    summary: {
      ok: true,
      scannedFileCount: files.length,
      markdownFileCount: fileSummaries.filter((item) => /\.md$/i.test(item.file)).length,
      nutFileCount: fileSummaries.filter((item) => /\.nut$/i.test(item.file)).length,
      totalBytes,
      totalLines,
      headingCount: fileSummaries.reduce((sum, item) => sum + item.headingCount, 0),
      classDeclarationCount: declarations.classes.size,
      functionDeclarationCount: declarations.functions.size,
      constantDeclarationCount: declarations.constants.size,
      candidateSymbolCount: allCandidates.size,
      riskBucketCount: risks.length,
    },
    familyCounts,
    files: fileSummaries,
    headings,
    topics,
    declarations: {
      classes: compactMap(declarations.classes, maxSymbols),
      functions: compactMap(declarations.functions, maxSymbols),
      constants: compactMap(declarations.constants, maxSymbols),
    },
    candidateSymbols: compactMap(candidateSymbols, maxSymbols),
    backtickSymbols: compactMap(backtickSymbols, maxSymbols),
    riskSignals: risks,
    boundaryComparison: {
      quickBoundarySymbolCount: quick.size,
      fullBoundarySymbolCount: full.size,
      candidateOrBacktickSymbolCount: allCandidates.size,
      missingFromQuickCount: [...allCandidates].filter((symbol) => !quick.has(symbol)).length,
      missingFromFullCount: [...allCandidates].filter((symbol) => !full.has(symbol)).length,
      missingFromQuick: missingFromQuick.map((symbol) => ({ symbol, categories: symbolCategories(symbol) })),
      missingFromFull: missingFromFull.map((symbol) => ({ symbol, categories: symbolCategories(symbol) })),
    },
    guidance: [
      "Treat every tutorial ID, APID, state, substate, PO ID, path, and static data index as source-clue only.",
      "Verify API names with TypeSquirrel when available; otherwise verify against target PVF same-family scripts before use.",
      "Do not copy tutorial code, screenshots, OCR text, or source stubs into clean knowledge-pack.",
      "Do not use dofile, sq_RunScript, loadfile, or file I/O examples as a default release PVF strategy.",
      "Before any write, close target character registry, skill .lst/.skl, load_state, pushState, pushPassiveObj, appendage, passiveobject, attackinfo, and readback.",
    ],
    warnings: [],
  };
}

function markdownReport(report) {
  const lines = [
    "# NUT Source Position Scan",
    "",
    `Generated at: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- scanned files: ${report.summary.scannedFileCount}`,
    `- markdown files: ${report.summary.markdownFileCount}`,
    `- nut files: ${report.summary.nutFileCount}`,
    `- candidate symbols: ${report.summary.candidateSymbolCount}`,
    `- risk buckets: ${report.summary.riskBucketCount}`,
    `- source path recorded: ${report.source.absoluteSourcePathRecorded}`,
    "",
    "## Families",
    "",
    ...report.familyCounts.map((item) => `- ${item.id}: ${item.count}`),
    "",
    "## Top Topics",
    "",
    ...report.topics.slice(0, 20).map((item) => `- ${item.id}: ${item.count} (${item.files.join(", ")})`),
    "",
    "## Risk Signals",
    "",
    ...report.riskSignals.map((item) => `- ${item.id}: ${item.count} (${item.files.join(", ")})`),
    "",
    "## Boundary Comparison",
    "",
    `- quick boundary symbols: ${report.boundaryComparison.quickBoundarySymbolCount}`,
    `- full boundary symbols: ${report.boundaryComparison.fullBoundarySymbolCount}`,
    `- candidates missing from quick boundary: ${report.boundaryComparison.missingFromQuickCount}`,
    `- candidates missing from full boundary: ${report.boundaryComparison.missingFromFullCount}`,
    "",
    "## Guidance",
    "",
    ...report.guidance.map((item) => `- ${item}`),
    "",
    "## Top Candidate Symbols",
    "",
    ...report.candidateSymbols.slice(0, 60).map((item) => `- ${item.symbol}: ${item.count} [${item.categories.join(", ")}]`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function runScan() {
  const source = option("--source");
  if (!source) throw new Error("scan requires --source <file-or-directory>.");
  const sourcePath = path.resolve(source);
  if (!fs.existsSync(sourcePath)) throw new Error(`Source does not exist: ${source}`);
  const maxSymbols = safeLimit("--max-symbols", 200);
  const maxHeadings = safeLimit("--max-headings", 200);
  const outRoot = path.resolve(option("--out", runtimePath(workbenchRoot, "nut-source-runs", timestamp())));
  fs.mkdirSync(outRoot, { recursive: true });
  const reportPath = path.join(outRoot, "NUT-SOURCE-CLUE-SCAN.json");
  const markdownPath = path.join(outRoot, "NUT-SOURCE-CLUE-SCAN.md");
  const scanned = scanSource(sourcePath, maxSymbols, maxHeadings);
  const report = {
    schemaVersion: "1.0",
    phase: "nut-source-clue-scan",
    generatedAt: new Date().toISOString(),
    reportPath,
    markdownPath,
    workbenchRoot,
    source: {
      kind: scanned.sourceKind,
      rootName: scanned.sourceRootName,
      absoluteSourcePathRecorded: scanned.absoluteSourcePathRecorded,
    },
    summary: scanned.summary,
    familyCounts: scanned.familyCounts,
    files: scanned.files,
    headings: scanned.headings,
    topics: scanned.topics,
    declarations: scanned.declarations,
    candidateSymbols: scanned.candidateSymbols,
    backtickSymbols: scanned.backtickSymbols,
    riskSignals: scanned.riskSignals,
    boundaryComparison: scanned.boundaryComparison,
    guidance: scanned.guidance,
    warnings: scanned.warnings,
  };
  writeJson(reportPath, report);
  fs.writeFileSync(markdownPath, markdownReport(report), "utf8");
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

try {
  if (command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(usage());
  } else if (command === "scan") {
    runScan();
  } else {
    throw new Error(usage());
  }
} catch (error) {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
}
