"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CLAIM_STATUS = new Set(["candidate", "accepted", "rejected", "superseded"]);
const SOURCE_CONFIDENCE = new Set(["anchor", "high", "candidate", "lead", "unknown"]);
const VERSION_APPLICABILITY = new Set(["declared-version", "observed-pvf", "cross-version", "target-verified", "unknown"]);
const DISTRIBUTION_STATUS = new Set(["redistributable", "facts-only", "local-research-only", "unknown"]);

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function safeId(value) {
  const result = String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!result) throw new Error("A stable ASCII source id is required.");
  return result;
}

function pathInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function assertExternalOutput(workbenchRoot, outputPath) {
  const resolved = path.resolve(outputPath);
  if (pathInside(workbenchRoot, resolved)) {
    throw new Error(`Research output must stay outside the Workbench: ${resolved}`);
  }
  return resolved;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

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

function writeJsonAtomic(file, value) {
  const resolved = path.resolve(file);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const temporary = `${resolved}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, resolved);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sourceFingerprint(files) {
  const lines = [...files]
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath, "zh-Hans-CN"))
    .map((item) => `${item.relativePath}\0${item.bytes}\0${item.sha256}`);
  return sha256(lines.join("\n"));
}

function newClaimStore(sourceManifestPath, sourceManifestSha256, sourceId) {
  return {
    schemaVersion: "1.0",
    phase: "external-research-claim-store",
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceManifests: [{
      sourceId,
      path: path.resolve(sourceManifestPath),
      sha256: sourceManifestSha256,
    }],
    statusValues: [...CLAIM_STATUS],
    confidenceValues: [...SOURCE_CONFIDENCE],
    versionApplicabilityValues: [...VERSION_APPLICABILITY],
    distributionStatusValues: [...DISTRIBUTION_STATUS],
    claims: [],
  };
}

function validateClaim(claim) {
  const errors = [];
  if (!claim || typeof claim !== "object") return ["Claim must be an object."];
  if (!/^[A-Za-z0-9._-]+$/.test(String(claim.claimId || ""))) errors.push("claimId must be stable ASCII.");
  for (const field of ["domain", "subjectType", "subject", "statement"]) {
    if (typeof claim[field] !== "string" || !claim[field].trim()) errors.push(`${field} is required.`);
  }
  if (!CLAIM_STATUS.has(claim.status)) errors.push(`Invalid status: ${claim.status}`);
  if (!SOURCE_CONFIDENCE.has(claim.sourceConfidence)) errors.push(`Invalid sourceConfidence: ${claim.sourceConfidence}`);
  if (!VERSION_APPLICABILITY.has(claim.versionApplicability)) errors.push(`Invalid versionApplicability: ${claim.versionApplicability}`);
  if (!DISTRIBUTION_STATUS.has(claim.distributionStatus)) errors.push(`Invalid distributionStatus: ${claim.distributionStatus}`);
  if (!Array.isArray(claim.sourceRefs) || claim.sourceRefs.length === 0) errors.push("sourceRefs must not be empty.");
  return errors;
}

function appendClaims(store, claims) {
  const existing = new Set((store.claims || []).map((claim) => claim.claimId));
  for (const claim of claims) {
    const errors = validateClaim(claim);
    if (errors.length) throw new Error(`Invalid claim ${claim?.claimId || "<unknown>"}: ${errors.join(" ")}`);
    if (existing.has(claim.claimId)) throw new Error(`Duplicate claimId: ${claim.claimId}`);
    existing.add(claim.claimId);
  }
  store.claims.push(...claims);
  store.updatedAt = new Date().toISOString();
  return store;
}

module.exports = {
  CLAIM_STATUS,
  DISTRIBUTION_STATUS,
  SOURCE_CONFIDENCE,
  VERSION_APPLICABILITY,
  appendClaims,
  assertExternalOutput,
  newClaimStore,
  pathInside,
  readJson,
  safeId,
  sha256,
  sha256File,
  sourceFingerprint,
  timestamp,
  validateClaim,
  writeJsonAtomic,
};
