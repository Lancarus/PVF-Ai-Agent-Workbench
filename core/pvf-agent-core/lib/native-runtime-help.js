"use strict";

const childProcess = require("child_process");

const OFFICIAL_RUNTIME_PAGE = "https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist";
const OFFICIAL_X64_DOWNLOAD = "https://aka.ms/vc14/vc_redist.x64.exe";

function errorText(error) {
  return `${error?.code || ""} ${error?.message || error || ""}`.trim();
}

function isLikelyNativeRuntimeFailure(error) {
  const text = errorText(error);
  return (
    error?.code === "ERR_DLOPEN_FAILED" ||
    /VCRUNTIME140|MSVCP140|api-ms-win-crt|dynamic link library|specified module could not be found/i.test(text)
  );
}

function helpLines() {
  return [
    "The bundled PVF native backend could not be loaded.",
    "The most common cause on 64-bit Windows is a missing or outdated Microsoft Visual C++ v14 x64 Redistributable.",
    `Official Microsoft instructions: ${OFFICIAL_RUNTIME_PAGE}`,
    `Official direct x64 installer: ${OFFICIAL_X64_DOWNLOAD}`,
    "After installation, run: workbench.bat check",
    "To open the official instructions manually, run: workbench.bat runtime-help --open",
  ];
}

function shouldAutoOpen(options = {}) {
  const platform = options.platform || process.platform;
  const env = options.env || process.env;
  const stdinIsTTY = options.stdinIsTTY ?? Boolean(process.stdin.isTTY);
  const stdoutIsTTY = options.stdoutIsTTY ?? Boolean(process.stdout.isTTY);
  return (
    platform === "win32" &&
    stdinIsTTY &&
    stdoutIsTTY &&
    !env.CI &&
    !env.PVF_WORKBENCH_NO_BROWSER
  );
}

function openOfficialRuntimePage(options = {}) {
  const platform = options.platform || process.platform;
  if (platform !== "win32") return { ok: false, url: OFFICIAL_RUNTIME_PAGE, error: "Automatic opening is supported only on Windows." };
  const spawn = options.spawn || childProcess.spawn;
  try {
    const child = spawn("explorer.exe", [OFFICIAL_RUNTIME_PAGE], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    if (typeof child.on === "function") child.on("error", () => {});
    if (typeof child.unref === "function") child.unref();
    return { ok: true, url: OFFICIAL_RUNTIME_PAGE };
  } catch (error) {
    return { ok: false, url: OFFICIAL_RUNTIME_PAGE, error: error.message };
  }
}

function selfTest() {
  const checks = [
    {
      id: "classify-dlopen-failure",
      ok: isLikelyNativeRuntimeFailure({ code: "ERR_DLOPEN_FAILED", message: "The specified module could not be found." }),
    },
    {
      id: "classify-vcruntime-name",
      ok: isLikelyNativeRuntimeFailure(new Error("VCRUNTIME140.dll is missing")),
    },
    {
      id: "do-not-classify-missing-native-file",
      ok: !isLikelyNativeRuntimeFailure({ code: "ENOENT", message: "native file is missing" }),
    },
    {
      id: "interactive-windows-auto-open",
      ok: shouldAutoOpen({ platform: "win32", env: {}, stdinIsTTY: true, stdoutIsTTY: true }),
    },
    {
      id: "automation-does-not-auto-open",
      ok: !shouldAutoOpen({ platform: "win32", env: { CI: "1" }, stdinIsTTY: true, stdoutIsTTY: true }),
    },
    {
      id: "official-x64-permalink",
      ok: OFFICIAL_X64_DOWNLOAD === "https://aka.ms/vc14/vc_redist.x64.exe",
    },
  ];
  return { ok: checks.every((check) => check.ok), checks };
}

module.exports = {
  OFFICIAL_RUNTIME_PAGE,
  OFFICIAL_X64_DOWNLOAD,
  helpLines,
  isLikelyNativeRuntimeFailure,
  openOfficialRuntimePage,
  selfTest,
  shouldAutoOpen,
};
