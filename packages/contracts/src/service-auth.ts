/**
 * FSTS AI Hub — Service request authentication contract.
 *
 * Machine-to-machine request authentication for connected systems. No human
 * identity provider (e.g. Clerk) is involved: a connected system authenticates
 * as a scoped service identity. The canonical request string is signed by the
 * service identity's private key and verified server-side against the stored
 * secret digest or public key.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";

/**
 * Headers carried by every authenticated service request.
 *
 * `keyId` identifies the service identity. `timestamp` and `nonce` provide
 * freshness and replay protection. `signature` is the hex-encoded signature
 * over the canonical request string.
 */
export const ServiceRequestHeadersSchema = z.object({
  keyId: z.string().min(8).max(128),
  timestamp: z.coerce.number().int().nonnegative(),
  nonce: z.string().min(16).max(128),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
});
export type ServiceRequestHeaders = z.infer<typeof ServiceRequestHeadersSchema>;

/**
 * Build the canonical, deterministic string that is signed and verified for a
 * service request.
 *
 * Field order and normalization are fixed so that signer and verifier agree
 * byte-for-byte: the method is upper-cased, the body digest is lower-cased, and
 * fields are joined with newlines. Any change to this function is a breaking
 * change to the service authentication contract.
 */
export function canonicalizeServiceRequest(input: {
  method: string;
  pathname: string;
  timestamp: number;
  nonce: string;
  bodyDigest: string;
}): string {
  return [
    input.method.toUpperCase(),
    input.pathname,
    String(input.timestamp),
    input.nonce,
    input.bodyDigest.toLowerCase(),
  ].join("\n");
}
