"use strict";

const { decodeText, normalizeEncoding } = require("./codec");

function looksLikeScript(bytes) {
  return bytes.length >= 2 && bytes[0] === 0xb0 && bytes[1] === 0xd0;
}

function parseTokens(bytes) {
  const tokens = [];
  if (!looksLikeScript(bytes)) return tokens;
  for (let offset = 2; offset + 4 < bytes.length; offset += 5) {
    tokens.push({ type: bytes[offset], value: bytes.readUInt32LE(offset + 1) >>> 0 });
  }
  return tokens;
}

function signed32(value) {
  return value > 0x7fffffff ? value - 0x100000000 : value;
}

function float32(value, keepIntegerDecimal = false) {
  const buffer = Buffer.allocUnsafe(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  const number = buffer.readFloatLE(0);
  if (!Number.isFinite(number)) return String(number);
  if (keepIntegerDecimal && Number.isInteger(number)) return number.toFixed(1);
  return number.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

class StringTable {
  constructor(values, encoding) {
    this.values = values;
    this.encoding = encoding;
  }

  static parse(bytes, encoding) {
    if (bytes.length < 8) throw new Error("stringtable.bin is too short.");
    const count = bytes.readInt32LE(0);
    const offsetTableEnd = 4 + (count + 1) * 4;
    if (count < 0 || offsetTableEnd > bytes.length) throw new Error("stringtable.bin has an invalid count or offset table.");
    const values = new Array(count);
    for (let index = 0; index < count; index += 1) {
      const relativeStart = bytes.readInt32LE(4 + index * 4);
      const relativeEnd = bytes.readInt32LE(8 + index * 4);
      const start = relativeStart + 4;
      const end = relativeEnd + 4;
      if (start < offsetTableEnd || end < start || end > bytes.length) {
        values[index] = `#{${index}}`;
        continue;
      }
      values[index] = decodeText(bytes.subarray(start, end), encoding);
    }
    return new StringTable(values, normalizeEncoding(encoding));
  }

  get(index) {
    return Number.isInteger(index) && index >= 0 && index < this.values.length
      ? this.values[index]
      : `#{${index}}`;
  }
}

class StringView {
  constructor(files, encoding) {
    this.files = files;
    this.encoding = encoding;
  }

  static async load(session, stringTable, encoding) {
    const registry = session.entry("n_string.lst");
    if (!registry) return new StringView([], encoding);
    const bytes = await session.readDecrypted(registry);
    const tokens = parseTokens(bytes);
    const count = Math.floor(tokens.length / 2);
    const files = new Array(count);
    for (let id = 0; id < count; id += 1) {
      const pathToken = tokens[id * 2 + 1];
      if (!pathToken) continue;
      const pvfPath = String(stringTable.get(pathToken.value) || "").replace(/\\/g, "/").toLowerCase();
      const entry = session.entry(pvfPath);
      if (!entry) continue;
      const raw = await session.readDecrypted(entry);
      const map = new Map();
      for (const line of decodeText(raw, encoding).split(/\r?\n/)) {
        if (!line || /^\s*\/\//.test(line)) continue;
        const separator = line.indexOf(">");
        if (separator <= 0) continue;
        const key = line.slice(0, separator).trim();
        if (key) map.set(key, line.slice(separator + 1).trim());
      }
      files[id] = map;
    }
    return new StringView(files, normalizeEncoding(encoding));
  }

  get(id, name) {
    return this.files[id]?.get(name) || "";
  }
}

function formatValue(token, currentSection, stringTable) {
  if (token.type === 4) return float32(token.value, currentSection === "[level property]");
  if (token.type === 6 || token.type === 8) return `{${token.type}=\`${stringTable.get(token.value)}\`}`;
  if (token.type === 2 || token.type === 3 || token.type === 10) return String(signed32(token.value));
  return `{${token.type}=${signed32(token.value)}}`;
}

function decompileLst(bytes, stringTable) {
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
    lines.push(`${code}\t\`${name}\``);
  }
  return lines.length > 1 ? `${lines.join("\r\n")}\r\n` : null;
}

function decompileScript(bytes, stringTable, stringView, options = {}) {
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
  StringTable,
  StringView,
  decompileLst,
  decompileScript,
  looksLikeScript,
  parseTokens,
};
