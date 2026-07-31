"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { decompileBinaryAni } = require("./ani");
const { createChecksum, decodeFileName, decodeText, decrypt, normalizeEncoding } = require("./codec");
const {
  StringTable,
  StringView,
  decompileLst,
  decompileScript,
  looksLikeScript,
  parseTokens,
} = require("./script");

const sessions = new Map();
const CACHE_LIMIT = 64 * 1024 * 1024;
const MAX_TREE_BYTES = 512 * 1024 * 1024;
const MAX_FILE_COUNT = 5_000_000;
const INFERRED_SCRIPT_EXTENSIONS = new Set([
  ".act", ".ai", ".aic", ".atk", ".chr", ".co", ".dgn", ".equ", ".etc",
  ".exp", ".job", ".key", ".lst", ".map", ".mob", ".obj", ".ptl", ".qst",
  ".set", ".shp", ".skl", ".stk", ".tbl", ".ui",
]);
const PLAIN_TEXT_EXTENSIONS = new Set([
  ".als", ".cfg", ".csv", ".ini", ".json", ".lua", ".nut", ".sqr", ".str",
  ".txt", ".xml", ".yaml", ".yml",
]);

function normalizePvfPath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/").toLowerCase();
}

function blockLength(length) {
  return (length + 3) & ~3;
}

function shortName(fileName) {
  const index = fileName.lastIndexOf("/");
  return index >= 0 ? fileName.slice(index + 1) : fileName;
}

function inferScript(fileName) {
  return INFERRED_SCRIPT_EXTENSIONS.has(path.posix.extname(fileName).toLowerCase());
}

function likelyText(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".ani.als")) return true;
  return PLAIN_TEXT_EXTENSIONS.has(path.posix.extname(lower));
}

function readonlyError(operation) {
  const error = new Error(`The TypeScript fallback backend is read-only; ${operation} is unavailable. Install the Microsoft Visual C++ v14 x64 runtime and rerun workbench.bat check before preparing or applying PVF writes.`);
  error.code = "READ_ONLY_FALLBACK";
  return error;
}

class ReadonlyPvfSession {
  constructor(sourcePath, encoding) {
    this.sessionId = crypto.randomUUID().replace(/-/g, "");
    this.sourcePath = sourcePath;
    this.encoding = normalizeEncoding(encoding, "Tw");
    this.handle = null;
    this.fileSize = 0;
    this.baseOffset = 0;
    this.fileVersion = 0;
    this.guid = "";
    this.entries = [];
    this.entriesByName = new Map();
    this.cache = new Map();
    this.cacheBytes = 0;
    this.stringTable = null;
    this.stringViews = new Map();
  }

  async readAt(position, length) {
    if (!Number.isSafeInteger(position) || !Number.isSafeInteger(length) || position < 0 || length < 0 || position + length > this.fileSize) {
      throw new Error(`Unsafe or out-of-range PVF read: position=${position} length=${length} fileSize=${this.fileSize}`);
    }
    const buffer = Buffer.allocUnsafe(length);
    let offset = 0;
    while (offset < length) {
      const result = await this.handle.read(buffer, offset, length - offset, position + offset);
      if (result.bytesRead <= 0) throw new Error(`Unexpected end of PVF at ${position + offset}.`);
      offset += result.bytesRead;
    }
    return buffer;
  }

  async open() {
    this.handle = await fs.promises.open(this.sourcePath, "r");
    try {
      this.fileSize = (await this.handle.stat()).size;
      const first = await this.readAt(0, 4);
      const guidLength = first.readInt32LE(0);
      if (guidLength < 0 || guidLength > 1024 || 4 + guidLength + 16 > this.fileSize) throw new Error(`Invalid PVF GUID length: ${guidLength}`);
      const header = await this.readAt(4, guidLength + 16);
      this.guid = header.subarray(0, guidLength).toString("ascii");
      let cursor = guidLength;
      this.fileVersion = header.readInt32LE(cursor); cursor += 4;
      const treeLength = header.readInt32LE(cursor); cursor += 4;
      const treeChecksum = header.readUInt32LE(cursor); cursor += 4;
      const fileCount = header.readInt32LE(cursor);
      if (treeLength <= 0 || treeLength > MAX_TREE_BYTES || treeLength % 4 !== 0) throw new Error(`Invalid PVF file-tree length: ${treeLength}`);
      if (fileCount < 0 || fileCount > MAX_FILE_COUNT) throw new Error(`Invalid PVF file count: ${fileCount}`);
      const encryptedTreeOffset = 4 + guidLength + 16;
      const encryptedTree = await this.readAt(encryptedTreeOffset, treeLength);
      const tree = decrypt(encryptedTree, treeChecksum);
      if (createChecksum(tree, tree.length, fileCount) !== treeChecksum) throw new Error("PVF file-tree checksum validation failed.");
      this.baseOffset = encryptedTreeOffset + treeLength;

      let treeOffset = 0;
      for (let index = 0; index < fileCount; index += 1) {
        if (treeOffset + 20 > tree.length) throw new Error(`PVF file tree ended before entry ${index}.`);
        const fileNameChecksum = tree.readUInt32LE(treeOffset); treeOffset += 4;
        const fileNameLength = tree.readUInt32LE(treeOffset); treeOffset += 4;
        if (fileNameLength > tree.length - treeOffset - 12) throw new Error(`PVF entry ${index} has an invalid file-name length.`);
        const fileName = decodeFileName(tree.subarray(treeOffset, treeOffset + fileNameLength)); treeOffset += fileNameLength;
        const dataLength = tree.readInt32LE(treeOffset); treeOffset += 4;
        const checksum = tree.readUInt32LE(treeOffset); treeOffset += 4;
        const dataOffset = tree.readInt32LE(treeOffset); treeOffset += 4;
        const paddedLength = blockLength(dataLength);
        if (!fileName || dataLength < 0 || dataOffset < 0 || this.baseOffset + dataOffset + paddedLength > this.fileSize) {
          throw new Error(`PVF entry ${index} has invalid metadata: ${fileName || "<empty>"}`);
        }
        const entry = {
          fileName,
          fileNameChecksum,
          dataLength,
          checksum,
          dataOffset,
          blockLength: paddedLength,
          isScriptFile: inferScript(fileName),
          isBinaryAniFile: fileName.endsWith(".ani") && !inferScript(fileName),
          kindConfirmed: false,
        };
        this.entries.push(entry);
        this.entriesByName.set(fileName, entry);
      }
      this.entries.sort((left, right) => left.fileName.localeCompare(right.fileName, "en"));
      return this;
    } catch (error) {
      await this.close();
      throw error;
    }
  }

  entry(fileName) {
    return this.entriesByName.get(normalizePvfPath(fileName));
  }

  remember(fileName, bytes) {
    if (bytes.length > CACHE_LIMIT / 2) return;
    if (this.cache.has(fileName)) {
      const previous = this.cache.get(fileName);
      this.cacheBytes -= previous.length;
      this.cache.delete(fileName);
    }
    this.cache.set(fileName, bytes);
    this.cacheBytes += bytes.length;
    while (this.cacheBytes > CACHE_LIMIT && this.cache.size > 0) {
      const oldest = this.cache.keys().next().value;
      const removed = this.cache.get(oldest);
      this.cache.delete(oldest);
      this.cacheBytes -= removed.length;
    }
  }

  async readDecrypted(entry) {
    const cached = this.cache.get(entry.fileName);
    if (cached) {
      this.cache.delete(entry.fileName);
      this.cache.set(entry.fileName, cached);
      return cached;
    }
    if (entry.blockLength === 0) return Buffer.alloc(0);
    const encrypted = await this.readAt(this.baseOffset + entry.dataOffset, entry.blockLength);
    const padded = decrypt(encrypted, entry.checksum);
    if (createChecksum(padded, padded.length, entry.fileNameChecksum) !== entry.checksum) {
      throw new Error(`PVF file checksum validation failed: ${entry.fileName}`);
    }
    const decrypted = padded.subarray(0, entry.dataLength);
    entry.isScriptFile = looksLikeScript(decrypted);
    entry.isBinaryAniFile = entry.fileName.endsWith(".ani") && !entry.isScriptFile;
    entry.kindConfirmed = true;
    this.remember(entry.fileName, decrypted);
    return decrypted;
  }

  async ensureStringTable() {
    if (this.stringTable) return this.stringTable;
    const entry = this.entry("stringtable.bin");
    if (!entry) throw new Error("PVF has no stringtable.bin; script text cannot be decompiled.");
    this.stringTable = StringTable.parse(await this.readDecrypted(entry), this.encoding);
    return this.stringTable;
  }

  async ensureStringView(encoding) {
    const normalized = normalizeEncoding(encoding, this.encoding);
    if (this.stringViews.has(normalized)) return this.stringViews.get(normalized);
    const view = await StringView.load(this, await this.ensureStringTable(), normalized);
    this.stringViews.set(normalized, view);
    return view;
  }

  async close() {
    if (this.handle) await this.handle.close().catch(() => {});
    this.handle = null;
    this.cache.clear();
    this.cacheBytes = 0;
    this.stringTable = null;
    this.stringViews.clear();
  }
}

function sessionById(sessionId) {
  const session = sessions.get(String(sessionId || ""));
  if (!session) throw new Error(`Unknown PVF session: ${sessionId}`);
  return session;
}

async function openSession(sourcePath, encoding = "Tw") {
  const resolved = path.resolve(String(sourcePath || ""));
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error(`PVF file does not exist: ${resolved}`);
  const session = await new ReadonlyPvfSession(resolved, encoding).open();
  sessions.set(session.sessionId, session);
  return {
    sessionId: session.sessionId,
    sourcePath: session.sourcePath,
    encoding: session.encoding,
    fileCount: session.entries.length,
    backend: "typescript-readonly-fallback",
    readOnly: true,
  };
}

async function getSession(sessionId) {
  const session = sessionById(sessionId);
  return {
    sessionId: session.sessionId,
    sourcePath: session.sourcePath,
    encoding: session.encoding,
    fileCount: session.entries.length,
    backend: "typescript-readonly-fallback",
    readOnly: true,
    cacheBytes: session.cacheBytes,
  };
}

async function closeSession(sessionId) {
  const session = sessionById(sessionId);
  sessions.delete(session.sessionId);
  await session.close();
  return {};
}

async function listFiles(sessionId) {
  return sessionById(sessionId).entries.map((entry) => ({
    fileName: entry.fileName,
    dataLength: entry.dataLength,
    isScriptFile: entry.isScriptFile,
    isBinaryAniFile: entry.isBinaryAniFile,
  }));
}

async function readFile(sessionId, fileName, options = {}) {
  const session = sessionById(sessionId);
  const entry = session.entry(fileName);
  if (!entry) throw new Error(`PVF file does not exist in session: ${fileName}`);
  const bytes = await session.readDecrypted(entry);
  const result = {
    fileName: entry.fileName,
    isScriptFile: entry.isScriptFile,
    isBinaryAniFile: entry.isBinaryAniFile,
    dataLength: entry.dataLength,
    backend: "typescript-readonly-fallback",
  };

  if (entry.isScriptFile && options.decompileScript !== false) {
    const table = await session.ensureStringTable();
    let text = entry.fileName.endsWith(".lst") ? decompileLst(bytes, table) : null;
    if (text === null) {
      const view = await session.ensureStringView(options.pvfEncoding || session.encoding);
      text = decompileScript(bytes, table, view, { autoConvertStringLink: Boolean(options.autoConvertStringLink) });
    }
    result.textContent = text;
  } else if (entry.isBinaryAniFile && options.decompileBinaryAni !== false) {
    const text = decompileBinaryAni(bytes);
    if (typeof text === "string") result.textContent = text;
    else result.base64Content = bytes.toString("base64");
  } else if (!entry.isScriptFile && likelyText(entry.fileName)) {
    result.textContent = decodeText(bytes, options.pvfEncoding || session.encoding);
  } else {
    result.base64Content = bytes.toString("base64");
  }
  return result;
}

function makeMatcher(keyword, mode) {
  if (mode === "Regex") {
    const regex = new RegExp(keyword, "i");
    return { test: (value) => regex.test(value), preview: (value) => value.match(regex)?.[0] || keyword };
  }
  const needle = keyword.toLowerCase();
  return {
    test: (value) => String(value).toLowerCase().includes(needle),
    preview: (value) => {
      const text = String(value);
      const index = text.toLowerCase().indexOf(needle);
      return index < 0 ? keyword : text.slice(Math.max(0, index - 80), Math.min(text.length, index + keyword.length + 80)).replace(/\s+/g, " ");
    },
  };
}

async function searchFiles(sessionId, query = {}) {
  const session = sessionById(sessionId);
  const keyword = String(query.keyword || "");
  if (!keyword) throw new Error("Search keyword is required.");
  const matcher = makeMatcher(keyword, query.matchMode || "Like");
  const searchPath = normalizePvfPath(query.searchPath || "");
  const allowed = Array.isArray(query.sourceFiles) && query.sourceFiles.length > 0
    ? new Set(query.sourceFiles.map(normalizePvfPath))
    : null;
  const candidates = session.entries.filter((entry) => {
    if (allowed && !allowed.has(entry.fileName)) return false;
    if (!searchPath) return true;
    return query.isUseLikeSearchPath ? entry.fileName.includes(searchPath) : entry.fileName.startsWith(searchPath);
  });
  const searchType = String(query.searchType || "SearchName");
  const items = [];
  let matchedCount = 0;

  if (searchType === "SearchFileName") {
    for (const entry of candidates) {
      const value = query.isStartMatch ? shortName(entry.fileName) : entry.fileName;
      const ok = query.isStartMatch ? value.toLowerCase().startsWith(keyword.toLowerCase()) : matcher.test(value);
      if (!ok) continue;
      matchedCount += 1;
      if (items.length < 5000) items.push({ fileName: entry.fileName, shortName: shortName(entry.fileName), preview: entry.fileName });
    }
    return { matchedCount, searchedCount: candidates.length, items, truncated: matchedCount > items.length };
  }

  let stringIndices = null;
  if (searchType === "SearchStrings") {
    const table = await session.ensureStringTable();
    stringIndices = new Set();
    for (let index = 0; index < table.values.length; index += 1) if (matcher.test(table.values[index])) stringIndices.add(index);
  }

  for (const entry of candidates) {
    try {
      const bytes = await session.readDecrypted(entry);
      let matched = false;
      let preview = keyword;
      if (searchType === "SearchStrings" && entry.isScriptFile) {
        for (const token of parseTokens(bytes)) {
          if ([5, 6, 7, 8, 10].includes(token.type) && stringIndices.has(token.value)) {
            matched = true;
            preview = (await session.ensureStringTable()).get(token.value);
            break;
          }
        }
      } else if (searchType === "SearchNutText" && entry.fileName.endsWith(".nut")) {
        const text = decodeText(bytes, query.pvfEncoding || "Kr");
        matched = matcher.test(text); preview = matcher.preview(text);
      } else if (entry.isScriptFile || likelyText(entry.fileName)) {
        const read = await readFile(sessionId, entry.fileName, {
          pvfEncoding: query.pvfEncoding || session.encoding,
          decompileScript: true,
          decompileBinaryAni: false,
          autoConvertStringLink: false,
          convertToSimplifiedChinese: false,
        });
        const text = read.textContent || "";
        if (searchType === "SearchName") {
          const nameBlock = text.match(/\[name\]\s*\r?\n([^\r\n]*)/i)?.[1] || "";
          matched = matcher.test(nameBlock); preview = matcher.preview(nameBlock);
        } else {
          matched = matcher.test(text); preview = matcher.preview(text);
        }
      }
      if (!matched) continue;
      matchedCount += 1;
      if (items.length < 5000) items.push({ fileName: entry.fileName, shortName: shortName(entry.fileName), preview });
    } catch {
      // A malformed individual file remains a non-match; callers still receive searchedCount.
    }
  }
  return { matchedCount, searchedCount: candidates.length, items, truncated: matchedCount > items.length };
}

async function releaseMemory(sessionId) {
  if (sessionId) {
    const session = sessionById(sessionId);
    session.cache.clear();
    session.cacheBytes = 0;
    session.stringViews.clear();
  } else {
    for (const session of sessions.values()) {
      session.cache.clear();
      session.cacheBytes = 0;
      session.stringViews.clear();
    }
  }
  return {};
}

function health() {
  return { backend: "typescript-readonly-fallback", readOnly: true, sourceAvailable: true };
}

function unsupported() {
  throw readonlyError("PVF write operation");
}

module.exports = {
  __workbenchBackend: { source: "typescript-readonly-fallback", readOnly: true, sourceAvailable: true },
  closeSession,
  deleteEntries: unsupported,
  extractEntries: unsupported,
  getFileMetadata: async (sessionId, fileName) => {
    const entry = sessionById(sessionId).entry(fileName);
    if (!entry) throw new Error(`PVF file does not exist in session: ${fileName}`);
    return { fileName: entry.fileName, dataLength: entry.dataLength, isScriptFile: entry.isScriptFile, isBinaryAniFile: entry.isBinaryAniFile };
  },
  getSession,
  health,
  importDirectory: unsupported,
  listFiles,
  openSession,
  readFile,
  releaseMemory,
  renameEntries: unsupported,
  resolveStringLink: async (sessionId, id, name, encoding) => (await sessionById(sessionId).ensureStringView(encoding)).get(Number(id), String(name)),
  saveSession: unsupported,
  searchFiles,
  upsertFile: unsupported,
  upsertTextFileRaw: unsupported,
};
