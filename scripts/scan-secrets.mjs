#!/usr/bin/env node
/**
 * FSTS AI Hub — repository secret scanner.
 *
 * Scans tracked files for patterns that indicate committed secrets or
 * sensitive material. This is a defense-in-depth control, not a substitute
 * for GitHub secret scanning or human review.
 *
 * Exit code 0 = clean, 1 = findings.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { extname } from "node:path";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // skip files larger than 2MB

// Files that are allowed to contain example/placeholder values.
const ALLOWLIST_PATHS = [
  /\.env\.example$/,
  /scan-secrets\.mjs$/,
  /\.md$/,
  /test\/fixtures\//,
  /__fixtures__\//,
  // Test files intentionally contain fake, non-functional secret-shaped
  // strings to exercise redaction and detection logic. They are never real.
  /\.(test|spec)\.[cm]?[jt]sx?$/,
];

// Binary / non-text extensions to skip.
const SKIP_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip", ".gz",
  ".tar", ".woff", ".woff2", ".ttf", ".eot", ".mp3", ".mp4", ".mov", ".wasm",
]);

/**
 * Each rule: { name, pattern, severity }.
 * Patterns are intentionally conservative to reduce false positives.
 */
const RULES = [
  { name: "AWS Access Key ID", severity: "critical", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "AWS Secret Access Key", severity: "critical", pattern: /aws_secret_access_key\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}/i },
  { name: "GitHub Token", severity: "critical", pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: "GitHub Fine-Grained PAT", severity: "critical", pattern: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/ },
  { name: "Google API Key", severity: "critical", pattern: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  { name: "Slack Token", severity: "critical", pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/ },
  { name: "Stripe Secret Key", severity: "critical", pattern: /\bsk_live_[0-9A-Za-z]{24,}\b/ },
  { name: "OpenAI API Key", severity: "critical", pattern: /\bsk-[A-Za-z0-9]{20,}T3BlbkFJ[A-Za-z0-9]{20,}\b/ },
  { name: "Anthropic API Key", severity: "critical", pattern: /\bsk-ant-[A-Za-z0-9\-_]{20,}\b/ },
  { name: "Private Key Block", severity: "critical", pattern: /-----BEGIN (RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/ },
  { name: "JWT", severity: "high", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: "Generic Secret Assignment", severity: "high", pattern: /(?:secret|password|passwd|api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*['"][^'"\s]{12,}['"]/i },
  { name: "Clerk Secret Key", severity: "critical", pattern: /\bsk_(test|live)_[A-Za-z0-9]{20,}\b/ },
  { name: "Convex Deploy Key", severity: "critical", pattern: /\b(prod|dev):[a-z0-9-]+:[A-Za-z0-9]{20,}\b/ },
  { name: "Database URL with Credentials", severity: "critical", pattern: /\b(?:postgres|postgresql|mysql|mongodb|redis):\/\/[^:\s]+:[^@\s]+@/i },
];

function listTrackedFiles() {
  try {
    // Include tracked AND untracked (but not ignored) files so the scan is
    // meaningful before the first commit as well as in CI.
    const tracked = execSync("git ls-files", { encoding: "utf8" });
    const untracked = execSync("git ls-files --others --exclude-standard", {
      encoding: "utf8",
    });
    const all = `${tracked}\n${untracked}`;
    return [...new Set(all.split("\n").map((l) => l.trim()).filter(Boolean))];
  } catch {
    // Fallback: scan the working tree if not a git repo.
    const out = execSync("find . -type f -not -path './.git/*' -not -path './node_modules/*'", {
      encoding: "utf8",
    });
    return out.split("\n").map((l) => l.replace(/^\.\//, "").trim()).filter(Boolean);
  }
}

function isAllowlisted(path) {
  return ALLOWLIST_PATHS.some((re) => re.test(path));
}

function main() {
  const files = listTrackedFiles();
  const findings = [];

  for (const file of files) {
    if (isAllowlisted(file)) continue;
    const ext = extname(file).toLowerCase();
    if (SKIP_EXTENSIONS.has(ext)) continue;

    let stat;
    try {
      stat = statSync(file);
    } catch {
      continue;
    }
    if (!stat.isFile() || stat.size > MAX_FILE_BYTES) continue;

    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split("\n");
    for (const rule of RULES) {
      lines.forEach((line, idx) => {
        if (rule.pattern.test(line)) {
          findings.push({
            file,
            line: idx + 1,
            rule: rule.name,
            severity: rule.severity,
          });
        }
      });
    }
  }

  if (findings.length === 0) {
    console.log(`✅ Secret scan clean — ${files.length} files scanned, 0 findings.`);
    process.exit(0);
  }

  console.error(`❌ Secret scan found ${findings.length} potential secret(s):\n`);
  for (const f of findings) {
    console.error(`  [${f.severity.toUpperCase()}] ${f.rule}`);
    console.error(`      ${f.file}:${f.line}`);
  }
  console.error(
    "\nIf a real secret was committed: STOP, report it, revoke it, and rotate it.\n" +
      "Removing it from a later commit is not sufficient. See SECURITY.md.",
  );
  process.exit(1);
}

main();
