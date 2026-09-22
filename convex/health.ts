import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

/**
 * Internal health query.
 *
 * This is intentionally an `internalQuery` so it is NOT part of the public
 * Convex function surface. The only public production surface is the
 * `GET /v1/health` HTTP action in `convex/http.ts`, which calls this query
 * server-side via `internal.health.status`.
 */
export const status = internalQuery({
  args: {},
  returns: v.object({
    service: v.literal("fsts-ai-hub"),
    status: v.literal("ok"),
    architecture: v.literal("headless-convex"),
    version: v.literal("0.1.0"),
  }),
  handler: async () => ({
    service: "fsts-ai-hub" as const,
    status: "ok" as const,
    architecture: "headless-convex" as const,
    version: "0.1.0" as const,
  }),
});
