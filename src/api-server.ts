/**
 * Dashboard API server.
 *
 * Standalone Express server that exposes /api/* endpoints for the
 * AI Agent Operations Hub dashboard. Runs alongside (or instead of)
 * the existing UltronOS worker — does NOT touch the cron/telegram code.
 *
 * Start it with:   npm run api
 * Default port:    3000 (override with PORT env var)
 *
 * Env vars (all optional except ANTHROPIC_API_KEY if you want to call
 * the Research Agent endpoint):
 *   PORT                   — server port (default 3000)
 *   ANTHROPIC_API_KEY      — required for POST /api/agents/research/start
 *   ANTHROPIC_MODEL        — defaults to claude-haiku-4-5-20251001
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { apiRouter } from "./api/routes.js";
import { tickSimulator } from "./api/state.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api", apiRouter);

// Root sanity check
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "ultronos-dashboard-api",
    endpoints: [
      "GET  /api/health",
      "GET  /api/agents",
      "GET  /api/agents/status",
      "GET  /api/agents/:id",
      "GET  /api/agents/:id/logs",
      "POST /api/agents/start",
      "POST /api/agents/pause",
      "POST /api/agents/reset",
      "POST /api/agents/:id/start",
      "POST /api/agents/:id/stop",
      "GET  /api/logs?limit=100",
      "GET  /api/tasks",
      "POST /api/tasks   { agentId, description }",
    ],
  });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`[api-server] listening on http://localhost:${port}`);
  console.log(`[api-server] try: curl http://localhost:${port}/api/agents/status`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[api-server] ANTHROPIC_API_KEY not set — Research Agent endpoint will return 500");
  }
});

// Background simulator — drives mock agent statuses forward every 700ms
// (same cadence as the frontend's local sim, so the dashboard sees smooth changes).
setInterval(tickSimulator, 700);
