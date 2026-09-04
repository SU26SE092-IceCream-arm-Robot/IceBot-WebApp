#!/usr/bin/env node

/**
 * Feature Architecture Validator for IceBot-WebApp
 * 
 * Verifies layering rules:
 * 1. UI atoms (`src/components/ui/**`) must not import from features (`src/components/features/**`), app routes (`src/app/**`), or API services (`src/lib/services/**`).
 * 2. API services (`src/lib/services/**`) must not import from UI components (`src/components/**`) or app routes (`src/app/**`).
 * 3. Pure types (`src/types/**`) must not import from UI components (`src/components/**`) or app routes (`src/app/**`).
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const SRC_DIR = path.resolve(process.cwd(), "src");

if (!fs.existsSync(SRC_DIR)) {
  console.error("Error: src directory not found at " + SRC_DIR);
  process.exit(1);
}

function getAllFiles(dir, extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs"]) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseImports(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
  const matches = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function normalizeImport(importPath, currentFilePath) {
  if (importPath.startsWith("@/")) {
    return importPath.replace(/^@\//, "src/");
  }
  if (importPath.startsWith(".")) {
    const resolved = path.resolve(path.dirname(currentFilePath), importPath);
    const rel = path.relative(process.cwd(), resolved).replace(/\\/g, "/");
    return rel;
  }
  return importPath;
}

const allSrcFiles = getAllFiles(SRC_DIR);
const violations = [];

for (const filePath of allSrcFiles) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  const imports = parseImports(filePath);

  for (const rawImport of imports) {
    const norm = normalizeImport(rawImport, filePath);

    // Rule 1: src/components/ui/ must not import from features, app routes, or services
    if (relativePath.startsWith("src/components/ui/")) {
      if (
        norm.startsWith("src/components/features/") ||
        norm.startsWith("src/app/") ||
        norm.startsWith("src/lib/services/")
      ) {
        violations.push({
          file: relativePath,
          import: rawImport,
          resolved: norm,
          rule: "UI primitives in src/components/ui must not depend on features, services, or app routes.",
        });
      }
    }

    // Rule 2: src/lib/services/ must not import from UI components or app routes
    if (relativePath.startsWith("src/lib/services/")) {
      if (norm.startsWith("src/components/") || norm.startsWith("src/app/")) {
        violations.push({
          file: relativePath,
          import: rawImport,
          resolved: norm,
          rule: "Data services in src/lib/services must not import UI components or app routes.",
        });
      }
    }

    // Rule 3: src/types/ must not import from components or app routes
    if (relativePath.startsWith("src/types/")) {
      if (norm.startsWith("src/components/") || norm.startsWith("src/app/")) {
        violations.push({
          file: relativePath,
          import: rawImport,
          resolved: norm,
          rule: "Domain types in src/types must not import UI components or app routes.",
        });
      }
    }
  }
}

console.log(`\n==> Feature Architecture Verification`);
console.log(`Scanned ${allSrcFiles.length} files under src/`);

if (violations.length > 0) {
  console.error(`\nFound ${violations.length} architecture boundary violation(s):\n`);
  for (const v of violations) {
    console.error(`  - File: ${v.file}`);
    console.error(`    Import: ${v.import} (${v.resolved})`);
    console.error(`    Rule: ${v.rule}\n`);
  }
  process.exit(1);
}

console.log(`PASS: All architecture boundaries verified cleanly with 0 violations.\n`);
process.exit(0);
