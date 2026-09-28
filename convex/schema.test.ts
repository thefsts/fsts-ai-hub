/**
 * FSTS AI Hub — Convex schema availability and index coverage tests.
 *
 * These tests assert that the deployed schema defines every required table and
 * that every read path is backed by an index (no unbounded scans). They also
 * assert the ownership classification supports client-owned systems such as
 * PlayRaise.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import schema from "./schema";

type TableDef = {
  indexes: { indexDescriptor: string; fields: string[] }[];
};

const tables = schema.tables as unknown as Record<string, TableDef>;

function indexNames(table: string): string[] {
  const def = tables[table];
  if (!def) throw new Error(`missing table: ${table}`);
  return def.indexes.map((i) => i.indexDescriptor);
}

describe("convex schema availability", () => {
  it("defines every required table", () => {
    expect(Object.keys(tables).sort()).toEqual(
      [
        "aiUsageRecords",
        "auditEvents",
        "budgetPolicies",
        "connectedSystems",
        "organizations",
        "providerPriceVersions",
        "serviceIdentities",
        "tenants",
      ].sort(),
    );
  });

  it("indexes the organization lookup by external key", () => {
    expect(indexNames("organizations")).toContain("by_external_key");
  });

  it("scopes tenants and connected systems by their parent", () => {
    expect(indexNames("tenants")).toEqual(
      expect.arrayContaining([
        "by_organization_id",
        "by_organization_id_and_external_key",
      ]),
    );
    expect(indexNames("connectedSystems")).toEqual(
      expect.arrayContaining(["by_tenant_id", "by_tenant_id_and_external_key"]),
    );
  });

  it("indexes service identities by key id and connected system", () => {
    expect(indexNames("serviceIdentities")).toEqual(
      expect.arrayContaining(["by_key_id", "by_connected_system_id"]),
    );
  });

  it("indexes provider price versions by provider, model, and effective time", () => {
    expect(indexNames("providerPriceVersions")).toContain(
      "by_provider_key_and_model_key_and_effective_at",
    );
  });

  it("scopes budget policies by tenant and scope", () => {
    expect(indexNames("budgetPolicies")).toEqual(
      expect.arrayContaining([
        "by_tenant_id",
        "by_tenant_id_and_scope_kind_and_scope_key",
      ]),
    );
  });

  it("indexes AI usage records for every read path", () => {
    expect(indexNames("aiUsageRecords")).toEqual(
      expect.arrayContaining([
        "by_tenant_id_and_occurred_at",
        "by_connected_system_id_and_occurred_at",
        "by_tenant_id_and_idempotency_key",
        "by_correlation_id",
      ]),
    );
  });

  it("indexes audit events by correlation id and tenant", () => {
    expect(indexNames("auditEvents")).toEqual(
      expect.arrayContaining([
        "by_correlation_id",
        "by_tenant_id_and_occurred_at",
      ]),
    );
  });

  it("classifies ownership so client-owned systems (PlayRaise) are distinct", () => {
    // The ownershipKind validator must accept client_owned, which is how
    // PlayRaise is classified, and must not collapse it into an FSTS value.
    const connectedSystems = tables.connectedSystems as unknown as {
      validator: { fields: Record<string, { members?: { value: string }[] }> };
    };
    const ownership = connectedSystems.validator.fields.ownershipKind;
    const members = (ownership?.members ?? []).map((m) => m.value);
    expect(members).toContain("client_owned");
    expect(members).toContain("fsts_owned");
    expect(members).toContain("partner_owned");
  });
});
