import { getStore } from "@netlify/blobs";
import { handle } from "../lib/core.mjs";

export default async (req) => {
  const store = getStore({ name: "duckett-permits", consistency: "strong" });
  try {
    return await handle(req, store);
  } catch (err) {
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
};

export const config = { path: "/api/permits" };
