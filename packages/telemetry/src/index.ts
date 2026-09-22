/**
 * FSTS AI Hub — Structured logging and correlation.
 *
 * Logs are structured JSON, carry correlation and trace IDs, and are redacted
 * before emission. Secrets and unrestricted sensitive content are never logged.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { redact } from "@fsts/redaction";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  correlationId?: string;
  traceId?: string;
  [key: string]: unknown;
}

export interface LoggerOptions {
  service: string;
  level?: LogLevel;
  /** Sink for emitted records. Defaults to stdout. */
  sink?: (record: LogRecord) => void;
}

export class Logger {
  private readonly service: string;
  private readonly level: LogLevel;
  private readonly sink: (record: LogRecord) => void;

  constructor(options: LoggerOptions) {
    this.service = options.service;
    this.level = options.level ?? "info";
    this.sink =
      options.sink ??
      ((record) => {
        process.stdout.write(`${JSON.stringify(record)}\n`);
      });
  }

  private emit(
    level: LogLevel,
    message: string,
    fields: Record<string, unknown> = {},
  ): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) return;
    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...(redact(fields) as Record<string, unknown>),
    };
    this.sink(record);
  }

  debug(message: string, fields?: Record<string, unknown>): void {
    this.emit("debug", message, fields);
  }
  info(message: string, fields?: Record<string, unknown>): void {
    this.emit("info", message, fields);
  }
  warn(message: string, fields?: Record<string, unknown>): void {
    this.emit("warn", message, fields);
  }
  error(message: string, fields?: Record<string, unknown>): void {
    this.emit("error", message, fields);
  }
}

/** Generate a correlation ID suitable for cross-system tracing. */
export function newCorrelationId(): string {
  return `corr_${crypto.randomUUID().replace(/-/g, "")}`;
}

/** Generate a trace ID suitable for OpenTelemetry-compatible tracing. */
export function newTraceId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
