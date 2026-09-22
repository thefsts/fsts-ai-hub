/**
 * FSTS AI Hub — Design system primitives.
 *
 * Small, accessible, dependency-light React primitives shared by the Command
 * Center and Developer Portal. These are presentation-only: they never fetch
 * data, never fabricate statistics, and always render honest empty states.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import * as React from "react";

/**
 * Capability classification. Every capability surfaced in the UI must be
 * labeled honestly with one of these values.
 */
export type CapabilityStatus =
  | "implemented_and_tested"
  | "implemented_not_integrated"
  | "interface_only"
  | "mock_or_simulation"
  | "blocked"
  | "not_started";

const CAPABILITY_LABELS: Record<CapabilityStatus, string> = {
  implemented_and_tested: "Implemented and tested",
  implemented_not_integrated: "Implemented, not integrated",
  interface_only: "Interface only",
  mock_or_simulation: "Mock or simulation",
  blocked: "Blocked",
  not_started: "Not started",
};

const CAPABILITY_COLORS: Record<CapabilityStatus, string> = {
  implemented_and_tested: "var(--fsts-color-implemented)",
  implemented_not_integrated: "var(--fsts-color-info)",
  interface_only: "var(--fsts-color-interface-only)",
  mock_or_simulation: "var(--fsts-color-mock)",
  blocked: "var(--fsts-color-blocked)",
  not_started: "var(--fsts-color-not-started)",
};

export interface CapabilityBadgeProps {
  status: CapabilityStatus;
}

/** A badge that honestly labels a capability's implementation status. */
export function CapabilityBadge({
  status,
}: CapabilityBadgeProps): React.ReactElement {
  return React.createElement(
    "span",
    {
      role: "status",
      "data-capability-status": status,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--fsts-space-2)",
        padding: "2px 8px",
        borderRadius: "var(--fsts-radius-sm)",
        fontSize: "var(--fsts-font-size-xs)",
        fontWeight: 600,
        color: "var(--fsts-color-text)",
        border: `1px solid ${CAPABILITY_COLORS[status]}`,
        background: "var(--fsts-color-surface-raised)",
      },
    },
    React.createElement("span", {
      "aria-hidden": "true",
      style: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: CAPABILITY_COLORS[status],
      },
    }),
    CAPABILITY_LABELS[status],
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  /** Optional honest note explaining why the state is empty. */
  note?: string | undefined;
}

/**
 * An honest empty state. Used wherever the Hub has no real data yet. It never
 * displays fabricated numbers or implies a connection that does not exist.
 */
export function EmptyState({
  title,
  description,
  note,
}: EmptyStateProps): React.ReactElement {
  return React.createElement(
    "div",
    {
      role: "note",
      style: {
        border: "1px dashed var(--fsts-color-border-strong)",
        borderRadius: "var(--fsts-radius-md)",
        padding: "var(--fsts-space-6)",
        background: "var(--fsts-color-surface)",
        color: "var(--fsts-color-text-muted)",
      },
    },
    React.createElement(
      "h3",
      { style: { margin: 0, color: "var(--fsts-color-text)" } },
      title,
    ),
    React.createElement(
      "p",
      { style: { marginTop: "var(--fsts-space-2)" } },
      description,
    ),
    note
      ? React.createElement(
          "p",
          {
            style: {
              marginTop: "var(--fsts-space-2)",
              fontSize: "var(--fsts-font-size-sm)",
              fontStyle: "italic",
            },
          },
          note,
        )
      : null,
  );
}

export interface StatProps {
  label: string;
  /** The value, or null when no real data exists. */
  value: string | number | null;
  /** Unit suffix, e.g. "USD". */
  unit?: string;
}

/**
 * A single statistic. When `value` is null, renders an explicit "No data"
 * marker rather than a fabricated zero.
 */
export function Stat({ label, value, unit }: StatProps): React.ReactElement {
  const hasValue = value !== null && value !== undefined;
  return React.createElement(
    "div",
    {
      style: {
        border: "1px solid var(--fsts-color-border)",
        borderRadius: "var(--fsts-radius-md)",
        padding: "var(--fsts-space-4)",
        background: "var(--fsts-color-surface)",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          fontSize: "var(--fsts-font-size-xs)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--fsts-color-text-muted)",
        },
      },
      label,
    ),
    React.createElement(
      "div",
      {
        style: {
          fontSize: "var(--fsts-font-size-xl)",
          fontWeight: 700,
          color: hasValue
            ? "var(--fsts-color-text)"
            : "var(--fsts-color-text-muted)",
        },
      },
      hasValue ? `${value}${unit ? ` ${unit}` : ""}` : "No data",
    ),
  );
}

export interface CardProps {
  title: string;
  children?: React.ReactNode;
}

/** A simple surface card. */
export function Card({ title, children }: CardProps): React.ReactElement {
  return React.createElement(
    "section",
    {
      style: {
        border: "1px solid var(--fsts-color-border)",
        borderRadius: "var(--fsts-radius-lg)",
        padding: "var(--fsts-space-6)",
        background: "var(--fsts-color-surface)",
        boxShadow: "var(--fsts-shadow-sm)",
      },
    },
    React.createElement(
      "h2",
      {
        style: {
          margin: 0,
          marginBottom: "var(--fsts-space-4)",
          fontSize: "var(--fsts-font-size-lg)",
          color: "var(--fsts-color-text)",
        },
      },
      title,
    ),
    children,
  );
}

export { CAPABILITY_LABELS, CAPABILITY_COLORS };
