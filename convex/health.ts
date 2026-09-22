import { v } from "convex/values";
import { query } from "./_generated/server";

export const status = query({
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
