import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/v1/health",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const health = await ctx.runQuery(api.health.status, {});
    return Response.json(health, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }),
});

export default http;
