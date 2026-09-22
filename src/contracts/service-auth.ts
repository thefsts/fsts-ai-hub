import { z } from "zod";

export const serviceRequestHeadersSchema = z.object({
  keyId: z.string().min(8).max(128),
  timestamp: z.coerce.number().int().nonnegative(),
  nonce: z.string().min(16).max(128),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

export type ServiceRequestHeaders = z.infer<typeof serviceRequestHeadersSchema>;

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
