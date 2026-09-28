/**
 * FSTS AI Hub — Sensitive-data redaction and filtering.
 *
 * Redaction is a defense-in-depth control applied before any payload is
 * logged, audited, or exported. It never replaces authorization.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

export const REDACTED = "[REDACTED]";

/** Field names whose values are always redacted, case-insensitively. */
const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /apikey/i,
  /authorization/i,
  /auth[_-]?header/i,
  /credential/i,
  /private[_-]?key/i,
  /client[_-]?secret/i,
  /session[_-]?id/i,
  /cookie/i,
  /ssn/i,
  /social[_-]?security/i,
  /credit[_-]?card/i,
  /card[_-]?number/i,
  /cvv/i,
  /dob/i,
  /date[_-]?of[_-]?birth/i,
];

/** Value patterns that are redacted wherever they appear in strings. */
const SENSITIVE_VALUE_PATTERNS: RegExp[] = [
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
  /\bsk-[A-Za-z0-9]{20,}\b/g,
  /\bsk-ant-[A-Za-z0-9\-_]{20,}\b/g,
  /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /\b\d{3}-\d{2}-\d{4}\b/g, // US SSN shape
  /\b(?:\d[ -]*?){13,16}\b/g, // card-number shape
];

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((re) => re.test(key));
}

/** Redact sensitive substrings from a string value. */
export function redactString(value: string): string {
  let out = value;
  for (const re of SENSITIVE_VALUE_PATTERNS) {
    out = out.replace(re, REDACTED);
  }
  return out;
}

/**
 * Recursively redact a value. Sensitive keys are replaced entirely; sensitive
 * substrings within strings are masked. Depth is bounded to avoid cycles.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 12) return REDACTED;
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = isSensitiveKey(k) ? REDACTED : redact(v, depth + 1);
    }
    return out;
  }
  return REDACTED;
}

/** Returns true when a value contains any detectable sensitive material. */
export function containsSensitiveData(value: unknown): boolean {
  if (typeof value === "string") {
    return SENSITIVE_VALUE_PATTERNS.some((re) => {
      re.lastIndex = 0;
      return re.test(value);
    });
  }
  if (Array.isArray(value)) return value.some(containsSensitiveData);
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(
      ([k, v]) => isSensitiveKey(k) || containsSensitiveData(v),
    );
  }
  return false;
}
