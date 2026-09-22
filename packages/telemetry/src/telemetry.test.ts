/**
 * FSTS AI Hub — Telemetry tests.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import {
  Logger,
  newCorrelationId,
  newTraceId,
  type LogRecord,
} from "./index.js";

function capture(): { records: LogRecord[]; sink: (r: LogRecord) => void } {
  const records: LogRecord[] = [];
  return { records, sink: (r) => records.push(r) };
}

describe("Logger", () => {
  it("emits structured records with service and timestamp", () => {
    const { records, sink } = capture();
    const log = new Logger({ service: "policy-engine", sink });
    log.info("started", { correlationId: "corr_12345678" });
    expect(records).toHaveLength(1);
    expect(records[0]?.service).toBe("policy-engine");
    expect(records[0]?.level).toBe("info");
    expect(records[0]?.timestamp).toBeDefined();
  });

  it("respects the minimum level", () => {
    const { records, sink } = capture();
    const log = new Logger({ service: "x", level: "warn", sink });
    log.debug("nope");
    log.info("nope");
    log.warn("yes");
    expect(records).toHaveLength(1);
    expect(records[0]?.level).toBe("warn");
  });

  it("redacts sensitive fields before emission", () => {
    const { records, sink } = capture();
    const log = new Logger({ service: "x", sink });
    log.info("auth", { password: "hunter2", token: "abc" });
    expect(records[0]?.password).toBe("[REDACTED]");
    expect(records[0]?.token).toBe("[REDACTED]");
  });
});

describe("id generation", () => {
  it("generates unique correlation IDs", () => {
    const a = newCorrelationId();
    const b = newCorrelationId();
    expect(a).not.toBe(b);
    expect(a.startsWith("corr_")).toBe(true);
  });

  it("generates trace IDs", () => {
    expect(newTraceId()).toMatch(/^[a-f0-9]{32}$/);
  });
});
