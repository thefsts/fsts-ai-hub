/**
 * FSTS AI Hub — Design system primitive tests.
 *
 * Verifies the primitives render honest states: capability badges label their
 * status, empty states never fabricate data, and statistics render an explicit
 * "No data" marker when no real value exists.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CAPABILITY_LABELS,
  CapabilityBadge,
  EmptyState,
  Stat,
  type CapabilityStatus,
} from "./index.js";

describe("CapabilityBadge", () => {
  it("labels every capability status honestly", () => {
    const statuses: CapabilityStatus[] = [
      "implemented_and_tested",
      "implemented_not_integrated",
      "interface_only",
      "mock_or_simulation",
      "blocked",
      "not_started",
    ];
    for (const status of statuses) {
      const html = renderToStaticMarkup(CapabilityBadge({ status }));
      expect(html).toContain(CAPABILITY_LABELS[status]);
      expect(html).toContain(`data-capability-status="${status}"`);
    }
  });
});

describe("EmptyState", () => {
  it("renders the honest title and description", () => {
    const html = renderToStaticMarkup(
      EmptyState({
        title: "No agents yet",
        description: "No AI agents have been registered.",
      }),
    );
    expect(html).toContain("No agents yet");
    expect(html).toContain("No AI agents have been registered.");
  });

  it("renders an optional note when provided", () => {
    const html = renderToStaticMarkup(
      EmptyState({
        title: "No data",
        description: "Nothing here.",
        note: "Connect a system to populate this view.",
      }),
    );
    expect(html).toContain("Connect a system to populate this view.");
  });
});

describe("Stat", () => {
  it("renders an explicit No data marker when value is null", () => {
    const html = renderToStaticMarkup(
      Stat({ label: "Monthly spend", value: null, unit: "USD" }),
    );
    expect(html).toContain("No data");
    expect(html).not.toContain("0 USD");
  });

  it("renders a real value with its unit", () => {
    const html = renderToStaticMarkup(
      Stat({ label: "Monthly spend", value: 12.5, unit: "USD" }),
    );
    expect(html).toContain("12.5 USD");
  });
});
