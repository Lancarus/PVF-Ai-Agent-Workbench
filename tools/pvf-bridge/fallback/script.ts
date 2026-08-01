"use strict";

const { decodeText, normalizeEncoding } = require("./codec.ts");

type ScriptToken = Readonly<{ type: number; value: number }>;
type ScriptReadOptions = Readonly<{ autoConvertStringLink?: boolean }>;

const SCRIPT_RESOURCE_LIMITS = Object.freeze({
  maxStringTableEntries: 5_000_000,
  maxDecodedStringCacheEntries: 100_000,
  maxScriptTokens: 5_000_000,
  maxStringViewFiles: 1_000_000,
});

function resourceLimitError(message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = "READ_ONLY_RESOURCE_LIMIT";
  return error;
}

function looksLikeScript(bytes: Buffer): boolean {
  return bytes.length >= 2 && bytes[0] === 0xb0 && bytes[1] === 0xd0;
}

function parseTokens(bytes: Buffer): ScriptToken[] {
  const tokens = [];
  if (!looksLikeScript(bytes)) return tokens;
  const tokenCount = Math.floor((bytes.length - 2) / 5);
  if (tokenCount > SCRIPT_RESOURCE_LIMITS.maxScriptTokens) {
    throw resourceLimitError(`PVF script token count exceeds the TypeScript fallback limit: ${tokenCount} > ${SCRIPT_RESOURCE_LIMITS.maxScriptTokens}.`);
  }
  for (let offset = 2; offset + 4 < bytes.length; offset += 5) {
    tokens.push({ type: bytes[offset], value: bytes.readUInt32LE(offset + 1) >>> 0 });
  }
  return tokens;
}

function signed32(value: number): number {
  return value > 0x7fffffff ? value - 0x100000000 : value;
}

function float32(value: number, keepIntegerDecimal = false): string {
  const buffer = Buffer.allocUnsafe(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  const number = buffer.readFloatLE(0);
  if (!Number.isFinite(number)) return String(number);
  if (keepIntegerDecimal && Number.isInteger(number)) return number.toFixed(1);
  return number.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

class StringTable {
  bytes: Buffer;
  count: number;
  offsetTableEnd: number;
  decoded: Map<number, string>;
  encoding: string;

  constructor(bytes: Buffer, count: number, offsetTableEnd: number, encoding: string) {
    this.bytes = bytes;
    this.count = count;
    this.offsetTableEnd = offsetTableEnd;
    this.decoded = new Map();
    this.encoding = encoding;
  }

  static parse(bytes: Buffer, encoding: string): StringTable {
    if (bytes.length < 8) throw new Error("stringtable.bin is too short.");
    const count = bytes.readInt32LE(0);
    if (count > SCRIPT_RESOURCE_LIMITS.maxStringTableEntries) {
      throw resourceLimitError(`StringTable entry count exceeds the TypeScript fallback limit: ${count} > ${SCRIPT_RESOURCE_LIMITS.maxStringTableEntries}.`);
    }
    const offsetTableEnd = 4 + (count + 1) * 4;
    if (count < 0 || offsetTableEnd > bytes.length) throw new Error("stringtable.bin has an invalid count or offset table.");
    return new StringTable(bytes, count, offsetTableEnd, normalizeEncoding(encoding));
  }

  get(index: number, cache = true): string {
    if (!Number.isInteger(index) || index < 0 || index >= this.count) return `#{${index}}`;
    if (cache && this.decoded.has(index)) return this.decoded.get(index);
    const relativeStart = this.bytes.readInt32LE(4 + index * 4);
    const relativeEnd = this.bytes.readInt32LE(8 + index * 4);
    const start = relativeStart + 4;
    const end = relativeEnd + 4;
    const value = start < this.offsetTableEnd || end < start || end > this.bytes.length
      ? `#{${index}}`
      : decodeText(this.bytes.subarray(start, end), this.encoding);
    if (cache) {
      this.decoded.set(index, value);
      while (this.decoded.size > SCRIPT_RESOURCE_LIMITS.maxDecodedStringCacheEntries) {
        this.decoded.delete(this.decoded.keys().next().value);
      }
    }
    return value;
  }
}

class StringView {
  session: any;
  paths: Array<string | undefined>;
  files: Array<Map<string, string> | undefined>;
  loaded: Set<number>;
  encoding: string;

  constructor(session: any, paths: Array<string | undefined>, encoding: string) {
    this.session = session;
    this.paths = paths;
    this.files = new Array(paths.length);
    this.loaded = new Set();
    this.encoding = encoding;
  }

  static async load(session: any, stringTable: StringTable, encoding: string): Promise<StringView> {
    const registry = session.entry("n_string.lst");
    if (!registry) return new StringView(session, [], encoding);
    const bytes = await session.readDecrypted(registry);
    const count = looksLikeScript(bytes) ? Math.floor(Math.floor((bytes.length - 2) / 5) / 2) : 0;
    if (count > SCRIPT_RESOURCE_LIMITS.maxStringViewFiles) {
      throw resourceLimitError(`StringView file count exceeds the TypeScript fallback limit: ${count} > ${SCRIPT_RESOURCE_LIMITS.maxStringViewFiles}.`);
    }
    const tokens = parseTokens(bytes);
    const paths = new Array(count);
    for (let id = 0; id < count; id += 1) {
      const pathToken = tokens[id * 2 + 1];
      if (!pathToken) continue;
      paths[id] = String(stringTable.get(pathToken.value) || "").replace(/\\/g, "/").toLowerCase();
    }
    return new StringView(session, paths, normalizeEncoding(encoding));
  }

  async ensure(ids: Iterable<number>): Promise<void> {
    for (const id of new Set(ids)) {
      if (!Number.isInteger(id) || id < 0 || id >= this.paths.length || this.loaded.has(id)) continue;
      this.loaded.add(id);
      const entry = this.paths[id] ? this.session.entry(this.paths[id]) : null;
      if (!entry) continue;
      const raw = await this.session.readDecrypted(entry);
      const map = new Map();
      for (const line of decodeText(raw, this.encoding).split(/\r?\n/)) {
        if (!line || /^\s*\/\//.test(line)) continue;
        const separator = line.indexOf(">");
        if (separator <= 0) continue;
        const key = line.slice(0, separator).trim();
        if (key) map.set(key, line.slice(separator + 1).trim());
      }
      this.files[id] = map;
    }
  }

  get(id: number, name: string): string {
    return this.files[id]?.get(name) || "";
  }
}

function stringViewIds(bytes: Buffer): number[] {
  const tokens = parseTokens(bytes);
  const ids = new Set<number>();
  for (let index = 0; index + 1 < tokens.length; index += 1) {
    if (tokens[index].type === 9 && tokens[index + 1].type === 10) ids.add(tokens[index].value);
  }
  return Array.from(ids);
}

function formatValue(token: ScriptToken, currentSection: string | null, stringTable: StringTable): string {
  if (token.type === 4) return float32(token.value, currentSection === "[level property]");
  if (token.type === 6 || token.type === 8) return `{${token.type}=\`${stringTable.get(token.value)}\`}`;
  if (token.type === 2 || token.type === 3 || token.type === 10) return String(signed32(token.value));
  return `{${token.type}=${signed32(token.value)}}`;
}

function decompileLst(bytes: Buffer, stringTable: StringTable): string | null {
  if (!looksLikeScript(bytes)) return null;
  const lines = ["#PVF_File"];
  for (let offset = 2; offset + 9 < bytes.length; offset += 10) {
    const firstType = bytes[offset];
    const secondType = bytes[offset + 5];
    if (![2, 3].includes(firstType) || ![6, 7, 8, 10].includes(secondType)) continue;
    const code = bytes.readInt32LE(offset + 1);
    const nameIndex = bytes.readUInt32LE(offset + 6);
    const name = stringTable.get(nameIndex);
    if (!name || /^#\{\d+\}$/.test(name)) continue;
    const normalizedName = name.replace(/\\/g, "/").replace(/^\/+/, "");
    lines.push(`${code}\t\`${normalizedName}\``);
  }
  return lines.length > 1 ? `${lines.join("\r\n")}\r\n` : null;
}

function decompileScript(
  bytes: Buffer,
  stringTable: StringTable,
  stringView: StringView | null,
  options: ScriptReadOptions = {},
): string {
  const tokens = parseTokens(bytes);
  if (tokens.length === 0) return "#PVF_File\r\n";
  const lines = ["#PVF_File"];
  let index = 0;
  let currentSection = null;
  const addOpeningSection = (name) => {
    if (lines.length > 1 && lines[lines.length - 1] !== "") lines.push("");
    lines.push(name);
  };

  while (index < tokens.length) {
    const token = tokens[index];
    if (token.type === 5) {
      const section = stringTable.get(token.value);
      if (section.startsWith("[/")) {
        lines.push(section);
        currentSection = null;
      } else {
        addOpeningSection(section);
        currentSection = section.toLowerCase();
      }
      index += 1;
      continue;
    }

    if (token.type === 9 && tokens[index + 1]?.type === 10) {
      const name = stringTable.get(tokens[index + 1].value);
      const resolved = stringView?.get(token.value, name) || name;
      lines.push(options.autoConvertStringLink ? `\`${resolved}\`` : `<${token.value}::${name}\`${resolved}\`>`);
      index += 2;
      continue;
    }

    if (token.type === 7) {
      const fields = [`\`${stringTable.get(token.value)}\``];
      index += 1;
      while (index < tokens.length && ![5, 7, 9].includes(tokens[index].type)) {
        fields.push(formatValue(tokens[index], currentSection, stringTable));
        index += 1;
      }
      lines.push(fields.join("\t"));
      continue;
    }

    const fields = [];
    while (index < tokens.length && ![5, 7, 9].includes(tokens[index].type)) {
      fields.push(formatValue(tokens[index], currentSection, stringTable));
      index += 1;
    }
    if (fields.length > 0) lines.push(fields.join("\t"));
    else index += 1;
  }

  return `${lines.join("\r\n")}\r\n`;
}

module.exports = {
  SCRIPT_RESOURCE_LIMITS,
  StringTable,
  StringView,
  decompileLst,
  decompileScript,
  looksLikeScript,
  parseTokens,
  stringViewIds,
};
