"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const NATIVE_FILE_NAME = "pvf_rust_core.node";
const OVERRIDE_ENV = "PVF_XPILOT_NATIVE";
const BACKEND_MODE_ENV = "PVF_WORKBENCH_BACKEND";
const FALLBACK_MODE = "typescript-readonly";

function sha256File(file) {
  const hash = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    while (true) {
      const count = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (count === 0) break;
      hash.update(buffer.subarray(0, count));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest("hex");
}

function assertNativeFile(candidate, label) {
  const resolved = path.resolve(candidate);
  if (path.extname(resolved).toLowerCase() !== ".node") {
    throw new Error(`${label} must point to a .node file: ${resolved}`);
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new Error(`${label} does not exist or is not a file: ${resolved}`);
  }
  return fs.realpathSync(resolved);
}

function resolveNativeBackend(options = {}) {
  const env = options.env || process.env;
  const bundledPath = path.resolve(options.bundledPath || path.join(__dirname, "native", NATIVE_FILE_NAME));
  const explicitOverride = String(env[OVERRIDE_ENV] || "").trim();
  let nativePath;
  let source;

  if (explicitOverride) {
    nativePath = assertNativeFile(explicitOverride, OVERRIDE_ENV);
    source = "explicit-env-override";
  } else if (fs.existsSync(bundledPath)) {
    nativePath = assertNativeFile(bundledPath, "Bundled PVF native backend");
    source = "workbench-bundled";
  } else {
    throw new Error(
      `Workbench is incomplete: bundled native backend is missing at ${bundledPath}. ` +
      "Run workbench.bat check.",
    );
  }

  return {
    path: nativePath,
    source,
    sha256: sha256File(nativePath),
    overrideEnvironmentVariable: source === "explicit-env-override" ? OVERRIDE_ENV : null,
  };
}

function findBundledNativeBackend() {
  return resolveNativeBackend().path;
}

function loadPvfBackend(options = {}) {
  const env = options.env || process.env;
  const mode = String(options.mode || env[BACKEND_MODE_ENV] || "auto").trim().toLowerCase();
  const fallbackApi = () => options.fallbackApi || require("./fallback/pvf-readonly-backend");
  if (mode === FALLBACK_MODE || mode === "fallback") {
    return {
      api: fallbackApi(),
      source: "typescript-readonly-fallback",
      readOnly: true,
      nativeError: null,
    };
  }
  if (!new Set(["auto", "native"]).has(mode)) {
    throw new Error(`${BACKEND_MODE_ENV} must be auto, native, or ${FALLBACK_MODE}.`);
  }

  let resolved;
  try {
    resolved = resolveNativeBackend(options);
    const requireFn = options.requireFn || require;
    const api = requireFn(resolved.path);
    if (!api || typeof api.openSession !== "function" || typeof api.readFile !== "function") {
      throw new Error("Native PVF backend is missing its read interface.");
    }
    return {
      api,
      source: resolved.source,
      readOnly: false,
      nativePath: resolved.path,
      nativeSha256: resolved.sha256,
      nativeError: null,
    };
  } catch (error) {
    const explicitOverride = Boolean(String(env[OVERRIDE_ENV] || "").trim());
    if (mode === "native" || explicitOverride || options.allowFallback === false) throw error;
    return {
      api: fallbackApi(),
      source: "typescript-readonly-fallback",
      readOnly: true,
      nativePath: resolved?.path || null,
      nativeSha256: resolved?.sha256 || null,
      nativeError: error.message,
    };
  }
}

function pathInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function nativeBackendSelfTest() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pvf-native-resolver-"));
  const checks = [];
  try {
    const bundled = path.join(tempRoot, "bundled", NATIVE_FILE_NAME);
    fs.mkdirSync(path.dirname(bundled), { recursive: true });
    fs.writeFileSync(bundled, "bundled-fixture", "utf8");
    const bundledResult = resolveNativeBackend({ env: {}, bundledPath: bundled });
    checks.push({ id: "bundled-selected", ok: bundledResult.source === "workbench-bundled" && bundledResult.path === fs.realpathSync(bundled) });

    const override = path.join(tempRoot, "override", NATIVE_FILE_NAME);
    fs.mkdirSync(path.dirname(override), { recursive: true });
    fs.writeFileSync(override, "override-fixture", "utf8");
    const overrideResult = resolveNativeBackend({ env: { [OVERRIDE_ENV]: override }, bundledPath: bundled });
    checks.push({ id: "explicit-override-selected", ok: overrideResult.source === "explicit-env-override" && overrideResult.path === fs.realpathSync(override) });

    let invalidOverrideRejected = false;
    try {
      resolveNativeBackend({ env: { [OVERRIDE_ENV]: path.join(tempRoot, "missing.txt") }, bundledPath: bundled });
    } catch (error) {
      invalidOverrideRejected = /\.node file/.test(String(error.message));
    }
    checks.push({ id: "invalid-override-rejected", ok: invalidOverrideRejected });

    const fakeNativeApi = { openSession() {}, readFile() {} };
    const selectedNative = loadPvfBackend({ env: {}, bundledPath: bundled, requireFn: () => fakeNativeApi });
    checks.push({ id: "load-native-api", ok: selectedNative.api === fakeNativeApi && selectedNative.readOnly === false });

    const forcedFallback = loadPvfBackend({ env: { [BACKEND_MODE_ENV]: FALLBACK_MODE } });
    checks.push({ id: "force-readonly-fallback", ok: forcedFallback.readOnly === true && forcedFallback.api.health().readOnly === true });

    const automaticFallback = loadPvfBackend({
      env: {},
      bundledPath: bundled,
      requireFn: () => { const error = new Error("fixture dlopen failure"); error.code = "ERR_DLOPEN_FAILED"; throw error; },
    });
    checks.push({ id: "native-load-failure-falls-back", ok: automaticFallback.readOnly === true && /dlopen/.test(automaticFallback.nativeError) });

    let fallbackWriteRejected = false;
    try {
      forcedFallback.api.saveSession("fixture", "fixture.pvf");
    } catch (error) {
      fallbackWriteRejected = error.code === "READ_ONLY_FALLBACK";
    }
    checks.push({ id: "fallback-write-rejected", ok: fallbackWriteRejected });
  } finally {
    if (!pathInside(os.tmpdir(), tempRoot)) throw new Error(`Unsafe native resolver temp path: ${tempRoot}`);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}

module.exports = {
  BACKEND_MODE_ENV,
  FALLBACK_MODE,
  NATIVE_FILE_NAME,
  OVERRIDE_ENV,
  findBundledNativeBackend,
  loadPvfBackend,
  nativeBackendSelfTest,
  resolveNativeBackend,
  sha256File,
};
