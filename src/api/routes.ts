/**
 * HTTP routes for the dashboard API.
 * All endpoints are mock/in-memory except POST /api/agents/research/start
 * (which calls a real Claude model — see research.ts).
 */

import { Router, type Request, type Response } from "express";
import { store } from "./state";
import { runResearchAgent } from "./research";

export const apiRouter = Router();

// ---------- Health ----------
apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ---------- Agents ----------
apiRouter.get("/agents", (_req, res) => {
  res.json({ agents: store.list() });
});

apiRouter.get("/agents/status", (_req, res) => {
  res.json({
    agents: store.list().map(a => ({
      id: a.id,
      name: a.name,
      status: a.status,
      progress: a.progress,
      active: a.active,
      currentTask: a.currentTask,
      lastAction: a.lastAction,
      updatedAt: a.updatedAt,
    })),
  });
});

// ---------- Global controls ----------
apiRouter.post("/agents/start", (_req, res) => {
  store.startAll();
  res.json({ ok: true, message: "All agents started", agents: store.list() });
});

apiRouter.post("/agents/pause", (_req, res) => {
  store.pauseAll();
  res.json({ ok: true, message: "All agents paused" });
});

apiRouter.post("/agents/reset", (_req, res) => {
  store.resetAll();
  res.json({ ok: true, message: "All agents reset to idle" });
});

// ---------- Per-agent controls ----------
apiRouter.get("/agents/:id", (req: Request, res: Response) => {
  const a = store.get(req.params.id);
  if (!a) { res.status(404).json({ ok: false, error: "agent not found" }); return; }
  res.json(a);
});

apiRouter.post("/agents/:id/start", async (req: Request, res: Response) => {
  const a = store.get(req.params.id);
  if (!a) { res.status(404).json({ ok: false, error: "agent not found" }); return; }

  // Researcher calls real AI for trend/idea generation (Etsy + TikTok content).
  if (a.id === "researcher") {
    store.start("researcher");
    try {
      const ideas = await runResearchAgent();
      res.json({ ok: true, agent: store.get("researcher"), result: ideas });
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, error: msg, agent: store.get("researcher") });
      return;
    }
  }

  // Other agents: simulator-driven (until cross-process Postgres bridge).
  store.start(req.params.id);
  res.json({ ok: true, agent: store.get(req.params.id) });
});

apiRouter.post("/agents/:id/stop", (req: Request, res: Response) => {
  const a = store.get(req.params.id);
  if (!a) { res.status(404).json({ ok: false, error: "agent not found" }); return; }
  store.stop(req.params.id);
  res.json({ ok: true, agent: a });
});

// ---------- Logs ----------
apiRouter.get("/logs", (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  // Flatten all agent logs sorted by timestamp desc
  const all = store.list()
    .flatMap(a => a.logs.map(L => ({ ...L, agentId: a.id, agentName: a.name })))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
  res.json({ logs: all });
});

apiRouter.get("/agents/:id/logs", (req: Request, res: Response) => {
  const a = store.get(req.params.id);
  if (!a) { res.status(404).json({ ok: false, error: "agent not found" }); return; }
  res.json({ agentId: a.id, logs: a.logs });
});

// ---------- Tasks ----------
apiRouter.post("/tasks", (req: Request, res: Response) => {
  const { agentId, description } = req.body ?? {};
  if (!agentId || !description) {
    res.status(400).json({ ok: false, error: "agentId and description required" });
    return;
  }
  if (!store.get(agentId)) {
    res.status(404).json({ ok: false, error: "agent not found" });
    return;
  }
  const task = store.createTask(String(agentId), String(description));
  store.log(agentId, `Task queued: ${description}`, "info");
  res.status(201).json({ ok: true, task });
});

apiRouter.get("/tasks", (_req, res) => {
  res.json({ tasks: store.tasksList() });
});
