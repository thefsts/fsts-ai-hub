/**
 * FSTS AI Hub — Organizations, tenants, environments, and connected systems.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  DataRegionSchema,
  EnvironmentKindSchema,
  IdSchema,
  LifecycleStatusSchema,
  RetentionPolicySchema,
  SystemOwnershipSchema,
  TimestampSchema,
} from "./primitives.js";

export const ORGANIZATIONS_CONTRACT_VERSION = "v1" as const;

/** An organization is the top-level billing and governance boundary. */
export const OrganizationSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  name: z.string().min(1).max(256),
  ownership: SystemOwnershipSchema,
  dataRegion: DataRegionSchema,
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Organization = z.infer<typeof OrganizationSchema>;

/**
 * A tenant is an isolation boundary within an organization. Client-owned
 * systems receive independent tenant boundaries.
 */
export const TenantSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  organizationId: IdSchema,
  name: z.string().min(1).max(256),
  ownership: SystemOwnershipSchema,
  dataRegion: DataRegionSchema,
  retentionPolicy: RetentionPolicySchema,
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Tenant = z.infer<typeof TenantSchema>;

/** An environment isolates development, test, staging, and production. */
export const EnvironmentSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  name: z.string().min(1).max(128),
  kind: EnvironmentKindSchema,
  dataRegion: DataRegionSchema,
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * A connected system is any product or service that integrates with the AI Hub.
 *
 * FSTS-owned products may be registered as first-party systems. Client-owned
 * systems (e.g. PlayRaise) must be classified as `client_owned` and require
 * explicit authorization, restricted tools and data, separate credentials,
 * separate memory, separate audit records, and revocation controls.
 */
export const ConnectedSystemSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  name: z.string().min(1).max(256),
  ownership: SystemOwnershipSchema,
  dataRegion: DataRegionSchema,
  retentionPolicy: RetentionPolicySchema,
  /** Adapter contract version the product system implements. */
  adapterContractVersion: ContractVersionSchema,
  /** Whether this system has been explicitly authorized to connect. */
  authorized: z.boolean(),
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type ConnectedSystem = z.infer<typeof ConnectedSystemSchema>;

/**
 * Product system registration request — the versioned contract a product-side
 * adapter uses to register with the AI Hub.
 */
export const ProductSystemRegistrationSchema = z.object({
  contractVersion: ContractVersionSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  systemName: z.string().min(1).max(256),
  ownership: SystemOwnershipSchema,
  dataRegion: DataRegionSchema,
  adapterContractVersion: ContractVersionSchema,
  /** Requested capabilities; subject to AI Hub authorization. */
  requestedCapabilities: z.array(z.string().min(1).max(128)).max(256),
  correlationId: z.string().min(8).max(128),
  idempotencyKey: z.string().min(8).max(256),
  requestedAt: TimestampSchema,
});
export type ProductSystemRegistration = z.infer<
  typeof ProductSystemRegistrationSchema
>;

/**
 * Guard: client-owned systems must never be classified as FSTS-owned.
 * Returns true when the classification is internally consistent.
 */
export function isOwnershipClassificationConsistent(
  ownership: z.infer<typeof SystemOwnershipSchema>,
  isFstsOwnedProduct: boolean,
): boolean {
  if (ownership === "client_owned" && isFstsOwnedProduct) return false;
  if (ownership === "fsts_first_party" && !isFstsOwnedProduct) return false;
  return true;
}
