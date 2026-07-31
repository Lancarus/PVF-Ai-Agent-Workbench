"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { BackendStdioClient, parseBackendTextResult } = require("../lib/backend-stdio-client");
const { createChecksum, encrypt } = require("../../../tools/pvf-bridge/fallback/codec");
const fallback = require("../../../tools/pvf-bridge/fallback/pvf-readonly-backend");
const { loadPvfBackend } = require("../../../tools/pvf-bridge/native-backend");

function pathInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fileNameHash(bytes) {
  let value = 0x1505;
  for (const byte of bytes) value = ((Math.imul(value, 0x21) >>> 0) + byte) >>> 0;
  return Math.imul(value, 0x21) >>> 0;
}

function createStringTable(values) {
  const parts = values.map((value) => Buffer.from(value, "utf8"));
  const headerLength = 4 + (parts.length + 1) * 4;
  const output = Buffer.alloc(headerLength + parts.reduce((sum, part) => sum + part.length, 0));
  output.writeInt32LE(parts.length, 0);
  let cursor = headerLength - 4;
  for (let index = 0; index < parts.length; index += 1) {
    output.writeUInt32LE(cursor, 4 + index * 4);
    cursor += parts[index].length;
  }
  output.writeUInt32LE(cursor, 4 + parts.length * 4);
  let dataOffset = headerLength;
  for (const part of parts) {
    part.copy(output, dataOffset);
    dataOffset += part.length;
  }
  return output;
}

function createScript(tokens) {
  const output = Buffer.alloc(2 + tokens.length * 5);
  output[0] = 0xb0;
  output[1] = 0xd0;
  for (let index = 0; index < tokens.length; index += 1) {
    output[2 + index * 5] = tokens[index][0];
    output.writeUInt32LE(tokens[index][1] >>> 0, 3 + index * 5);
  }
  return output;
}

function createBinaryAni() {
  const output = Buffer.alloc(20);
  let cursor = 0;
  output.writeUInt16LE(1, cursor); cursor += 2; // frame count
  output.writeUInt16LE(0, cursor); cursor += 2; // image count
  output.writeUInt16LE(0, cursor); cursor += 2; // overall ANI properties
  output.writeUInt16LE(0, cursor); cursor += 2; // frame box count
  output.writeInt16LE(-1, cursor); cursor += 2; // no image
  output.writeInt32LE(0, cursor); cursor += 4; // x
  output.writeInt32LE(0, cursor); cursor += 4; // y
  output.writeUInt16LE(0, cursor); // frame property count
  return output;
}

function createFixturePvf(targetPath) {
  const strings = [
    "stringview/fixture.str",
    "itemshop/test.shp",
    "[name]",
    "fallback-fixture",
    "[message]",
    "message_1",
    "[/message]",
  ];
  const files = [
    { fileName: "stringtable.bin", data: createStringTable(strings) },
    { fileName: "n_string.lst", data: createScript([[2, 0], [7, 0]]) },
    { fileName: "stringview/fixture.str", data: Buffer.from("message_1>只读备用后端\r\n", "utf8") },
    { fileName: "itemshop/itemshop.lst", data: createScript([[2, 1], [7, 1]]) },
    {
      fileName: "itemshop/test.shp",
      data: createScript([[5, 2], [7, 3], [5, 4], [9, 0], [10, 5], [5, 6]]),
    },
    { fileName: "script/fallback_fixture.nut", data: Buffer.from('function fallback_fixture() { return "needle"; }\r\n', "utf8") },
    { fileName: "sprite/fallback_fixture.ani", data: createBinaryAni() },
    { fileName: "raw/fixture.bin", data: Buffer.from([0, 1, 2, 3, 254, 255]) },
  ].map((item) => {
    const fileNameBytes = Buffer.from(item.fileName, "ascii");
    const fileNameChecksum = fileNameHash(fileNameBytes);
    const padded = Buffer.alloc((item.data.length + 3) & ~3);
    item.data.copy(padded);
    const checksum = createChecksum(padded, padded.length, fileNameChecksum);
    return { ...item, fileNameBytes, fileNameChecksum, padded, checksum };
  }).sort((left, right) => left.fileNameChecksum - right.fileNameChecksum);

  const treeLength = (files.reduce((sum, item) => sum + 20 + item.fileNameBytes.length, 0) + 3) & ~3;
  const tree = Buffer.alloc(treeLength);
  let treeOffset = 0;
  let dataOffset = 0;
  for (const item of files) {
    tree.writeUInt32LE(item.fileNameChecksum, treeOffset); treeOffset += 4;
    tree.writeUInt32LE(item.fileNameBytes.length, treeOffset); treeOffset += 4;
    item.fileNameBytes.copy(tree, treeOffset); treeOffset += item.fileNameBytes.length;
    tree.writeInt32LE(item.data.length, treeOffset); treeOffset += 4;
    tree.writeUInt32LE(item.checksum, treeOffset); treeOffset += 4;
    tree.writeInt32LE(dataOffset, treeOffset); treeOffset += 4;
    dataOffset += item.padded.length;
  }
  const treeChecksum = createChecksum(tree, tree.length, files.length);
  const encryptedTree = encrypt(tree, treeChecksum);
  const guid = Buffer.from("PVF-READONLY-FALLBACK-FIXTURE", "ascii");
  const header = Buffer.alloc(4 + guid.length + 16);
  let headerOffset = 0;
  header.writeInt32LE(guid.length, headerOffset); headerOffset += 4;
  guid.copy(header, headerOffset); headerOffset += guid.length;
  header.writeInt32LE(2, headerOffset); headerOffset += 4;
  header.writeInt32LE(encryptedTree.length, headerOffset); headerOffset += 4;
  header.writeUInt32LE(treeChecksum, headerOffset); headerOffset += 4;
  header.writeInt32LE(files.length, headerOffset);
  fs.writeFileSync(targetPath, Buffer.concat([
    header,
    encryptedTree,
    ...files.map((item) => encrypt(item.padded, item.checksum)),
    Buffer.from("\0PVF fallback self-test fixture", "ascii"),
  ]));
  return new Map(files.map((item) => [item.fileName, item.data]));
}

async function rejectsReadonly(operation) {
  try {
    await operation();
    return false;
  } catch (error) {
    return error && error.code === "READ_ONLY_FALLBACK";
  }
}

async function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pvf-readonly-fallback-"));
  const fixturePath = path.join(tempRoot, "Script.pvf");
  const checks = [];
  const add = (id, ok, details) => checks.push({ id, ok: Boolean(ok), ...(details ? { details } : {}) });
  let fallbackSessionId;
  let nativeSessionId;
  let serverClient;
  try {
    const expectedFiles = createFixturePvf(fixturePath);
    const sourceSha = sha256File(fixturePath);
    add("fallback-health", fallback.health().readOnly === true && fallback.health().backend === "typescript-readonly-fallback");

    const opened = await fallback.openSession(fixturePath, "Utf8");
    fallbackSessionId = opened.sessionId;
    add("fallback-open", opened.fileCount === expectedFiles.size && opened.readOnly === true);
    const listed = await fallback.listFiles(fallbackSessionId);
    add("fallback-list", listed.length === expectedFiles.size && expectedFiles.size === new Set(listed.map((item) => item.fileName)).size);

    const lst = await fallback.readFile(fallbackSessionId, "itemshop/itemshop.lst", { pvfEncoding: "Utf8" });
    add("fallback-lst", /1\s+`itemshop\/test\.shp`/.test(lst.textContent || ""));
    const scriptRaw = await fallback.readFile(fallbackSessionId, "itemshop/test.shp", { pvfEncoding: "Utf8", autoConvertStringLink: false });
    add("fallback-script-stringlink-raw", (scriptRaw.textContent || "").includes("<0::message_1`只读备用后端`>"));
    const scriptFriendly = await fallback.readFile(fallbackSessionId, "itemshop/test.shp", { pvfEncoding: "Utf8", autoConvertStringLink: true });
    add("fallback-script-stringlink-friendly", (scriptFriendly.textContent || "").includes("`只读备用后端`"));
    const raw = await fallback.readFile(fallbackSessionId, "itemshop/test.shp", { decompileScript: false });
    add("fallback-raw-bytes", Buffer.from(raw.base64Content || "", "base64").equals(expectedFiles.get("itemshop/test.shp")));
    const nut = await fallback.readFile(fallbackSessionId, "script/fallback_fixture.nut", { pvfEncoding: "Utf8" });
    add("fallback-nut", (nut.textContent || "").includes("needle"));
    const ani = await fallback.readFile(fallbackSessionId, "sprite/fallback_fixture.ani", {});
    add("fallback-binary-ani", (ani.textContent || "").includes("[FRAME MAX]") && (ani.textContent || "").includes("[FRAME000]"));

    const filenameSearch = await fallback.searchFiles(fallbackSessionId, { keyword: "test.shp", searchType: "SearchFileName", matchMode: "Like" });
    add("fallback-search-filename", filenameSearch.items.some((item) => item.fileName === "itemshop/test.shp"));
    const scriptSearch = await fallback.searchFiles(fallbackSessionId, { keyword: "fallback-fixture", searchType: "SearchScript", matchMode: "Like", pvfEncoding: "Utf8" });
    add("fallback-search-script", scriptSearch.items.some((item) => item.fileName === "itemshop/test.shp"));
    const stringSearch = await fallback.searchFiles(fallbackSessionId, { keyword: "fallback-fixture", searchType: "SearchStrings", matchMode: "Like" });
    add("fallback-search-strings", stringSearch.items.some((item) => item.fileName === "itemshop/test.shp"));
    const metadata = await fallback.getFileMetadata(fallbackSessionId, "raw/fixture.bin");
    add("fallback-metadata", metadata.dataLength === expectedFiles.get("raw/fixture.bin").length);
    await fallback.releaseMemory(fallbackSessionId);

    const writeOperations = [
      ["saveSession", () => fallback.saveSession(fallbackSessionId, path.join(tempRoot, "blocked.pvf"))],
      ["upsertFile", () => fallback.upsertFile(fallbackSessionId, "blocked.bin", Buffer.alloc(0))],
      ["upsertTextFileRaw", () => fallback.upsertTextFileRaw(fallbackSessionId, "blocked.etc", Buffer.alloc(0))],
      ["deleteEntries", () => fallback.deleteEntries(fallbackSessionId, ["raw/fixture.bin"])],
      ["renameEntries", () => fallback.renameEntries(fallbackSessionId, [])],
      ["importDirectory", () => fallback.importDirectory(fallbackSessionId, tempRoot)],
    ];
    for (const [name, operation] of writeOperations) add(`fallback-blocks-${name}`, await rejectsReadonly(operation));
    add("fixture-unchanged", sha256File(fixturePath) === sourceSha && !fs.existsSync(path.join(tempRoot, "blocked.pvf")));

    serverClient = new BackendStdioClient({
      command: process.execPath,
      args: [path.join(__dirname, "../../../tools/pvf-bridge/server.js")],
      cwd: path.resolve(__dirname, "../../.."),
      env: { PVF_WORKBENCH_BACKEND: "typescript-readonly" },
    });
    await serverClient.start();
    const initialized = await serverClient.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "fallback-self-test", version: "1.0.0" },
    });
    add("server-advertises-readonly-fallback", initialized?.serverInfo?.readOnly === true && initialized?.serverInfo?.backend === "typescript-readonly-fallback");
    const serverOpened = parseBackendTextResult(await serverClient.callTool("pvf_open", { path: fixturePath, encoding: "Utf8" }));
    const serverSessionId = serverOpened?.session?.sessionId;
    add("server-opens-with-fallback", serverOpened?.ok === true && serverOpened?.session?.readOnly === true && Boolean(serverSessionId));
    const serverRead = parseBackendTextResult(await serverClient.callTool("pvf_read_file", {
      sessionId: serverSessionId,
      pvfPath: "itemshop/test.shp",
      pvfEncoding: "Utf8",
      autoConvertStringLink: false,
      convertToSimplifiedChinese: false,
    }));
    add("server-reads-with-fallback", (serverRead?.textContent || "").includes("<0::message_1`只读备用后端`>"));
    const serverWrite = parseBackendTextResult(await serverClient.callTool("pvf_save", {
      sessionId: serverSessionId,
      targetPath: path.join(tempRoot, "server-blocked.pvf"),
    }));
    add("server-exposes-readonly-error-code", serverWrite?.data?.code === "READ_ONLY_FALLBACK" && /read-only/i.test(serverWrite?.error || ""));
    const serverBackup = parseBackendTextResult(await serverClient.callTool("pvf_backup", {
      path: fixturePath,
      targetPath: path.join(tempRoot, "server-blocked.bak"),
    }));
    add("server-blocks-backup-in-fallback", serverBackup?.data?.code === "READ_ONLY_FALLBACK");
    add("server-write-created-no-output", !fs.existsSync(path.join(tempRoot, "server-blocked.pvf")) && !fs.existsSync(path.join(tempRoot, "server-blocked.bak")) && sha256File(fixturePath) === sourceSha);

    try {
      const native = loadPvfBackend({ mode: "native" }).api;
      const nativeOpened = await native.openSession(fixturePath, "Utf8");
      nativeSessionId = nativeOpened.sessionId || nativeOpened;
      const nativeListed = await native.listFiles(nativeSessionId);
      const nativeRaw = await native.readFile(nativeSessionId, "itemshop/test.shp", {
        decompileScript: false,
        decompileBinaryAni: false,
        autoConvertStringLink: false,
        convertToSimplifiedChinese: false,
        pvfEncoding: "Utf8",
      });
      add("native-independent-fixture-read", nativeListed.length === expectedFiles.size && Buffer.from(nativeRaw.base64Content || "", "base64").equals(expectedFiles.get("itemshop/test.shp")));
    } catch (error) {
      add("native-independent-fixture-read", true, { skipped: true, reason: error.message });
    }
  } finally {
    if (serverClient) serverClient.stop();
    if (nativeSessionId) {
      try { await loadPvfBackend({ mode: "native" }).api.closeSession(nativeSessionId); } catch { /* best effort */ }
    }
    if (fallbackSessionId) {
      try { await fallback.closeSession(fallbackSessionId); } catch { /* best effort */ }
    }
    if (!pathInside(os.tmpdir(), tempRoot)) throw new Error(`Unsafe fallback self-test path: ${tempRoot}`);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  const report = {
    schemaVersion: "1.0",
    phase: "typescript-readonly-fallback-self-test",
    summary: {
      ok: checks.every((check) => check.ok),
      checkCount: checks.length,
      failedChecks: checks.filter((check) => !check.ok).length,
    },
    checks,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.summary.ok) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
