/**
 * In-memory agent state for the dashboard API.
 * Mock-first: no DB, no real agent execution (except Astra/trend in research.ts).
 *
 * Mirrors the ULTRONOS agent roster the v1 dashboard expects.
 */

export type AgentStatus =
  | "idle"
  | "thinking"
  | "working"
  | "waiting"
  | "complete"
  | "error";

export interface AgentLog {
  timestamp: string;
  message: string;
  level: "info" | "ok" | "warn" | "err";
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTask: string | null;
  progress: number;
  lastAction: string;
  logs: AgentLog[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  result?: unknown; // populated by Astra after AI call
}

export interface Task {
  id: string;
  agentId: string;
  description: string;
  status: "queued" | "running" | "done" | "failed";
  createdAt: string;
}

const now = () => new Date().toISOString();
const id = () => Math.random().toString(36).slice(2, 10);

/**
 * ULTRONOS roster — matches v1 dashboard chambers exactly.
 * Chamber data-room → agent id mapping:
 *   trend → Astra, ideas → Vega, script → Nova, image → Pixel,
 *   listing → Forge, seo → Sage, qa → Lumen, publish → Atlas,
 *   msg → Echo, sales → Oracle
 */
const AGENT_DEFS: Array<{ id: string; name: string; role: string }> = [
  { id: "trend",   name: "Astra",  role: "Recon Analyst — trend research & competitive scans" },
  { id: "ideas",   name: "Vega",   role: "Ideation — digital product concepts" },
  { id: "script",  name: "Nova",   role: "Copy Synth — voiceover, descriptions, scripts" },
  { id: "image",   name: "Pixel",  role: "Visual Forge — mockup & image generation" },
  { id: "listing", name: "Forge",  role: "Listing Smith — Etsy SKU assembly" },
  { id: "seo",     name: "Sage",   role: "Keyword Oracle — title & tag optimization" },
  { id: "qa",      name: "Lumen",  role: "Integrity Audit — mockup & listing QA" },
  { id: "publish", name: "Atlas",  role: "Deploy Engineer — Printify/Etsy publishing" },
  { id: "msg",     name: "Echo",   role: "Support Liaison — customer messages" },
  { id: "sales",   name: "Oracle", role: "Revenue Sentinel — analytics & forecasts" },
];

function createAgent(def: { id: string; name: string; role: string }): Agent {
  const t = now();
  return {
    id: def.id,
    name: def.name,
    role: def.role,
    status: "idle",
    currentTask: null,
    progress: 0,
    lastAction: "Initialized",
    logs: [],
    active: false,
    createdAt: t,
    updatedAt: t,
  };
}

class AgentStore {
  agents: Agent[] = AGENT_DEFS.map(createAgent);
  tasks: Task[] = [];

  list() { return this.agents; }
  get(agentId: string) { return this.agents.find(a => a.id === agentId); }
  tasksList() { return this.tasks; }

  log(agentId: string, message: string, level: AgentLog["level"] = "info") {
    const a = this.get(agentId);
    if (!a) return;
    a.logs.unshift({ timestamp: now(), message, level });
    if (a.logs.length > 50) a.logs.length = 50;
    a.updatedAt = now();
  }

  setStatus(agentId: string, status: AgentStatus, currentTask?: string | null) {
    const a = this.get(agentId);
    if (!a) return;
    a.status = status;
    if (currentTask !== undefined) a.currentTask = currentTask;
    a.lastAction = `Status → ${status}` + (currentTask ? ` (${currentTask})` : "");
    a.updatedAt = now();
  }

  setProgress(agentId: string, progress: number) {
    const a = this.get(agentId);
    if (!a) return;
    a.progress = Math.max(0, Math.min(100, progress));
    a.updatedAt = now();
  }

  setResult(agentId: string, result: unknown) {
    const a = this.get(agentId);
    if (!a) return;
    a.result = result;
    a.updatedAt = now();
  }

  start(agentId: string) {
    const a = this.get(agentId);
    if (!a) return;
    a.active = true;
    if (a.status === "complete" || a.status === "error" || a.status === "idle") {
      a.status = "thinking";
      a.progress = 0;
    }
    a.lastAction = "Started";
    a.updatedAt = now();
    this.log(agentId, "Agent started", "info");
  }

  stop(agentId: string) {
    const a = this.get(agentId);
    if (!a) return;
    a.active = false;
    a.lastAction = "Stopped";
    a.updatedAt = now();
    this.log(agentId, "Agent stopped", "warn");
  }

  pauseAll() {
    this.agents.forEach(a => { a.active = false; a.updatedAt = now(); });
  }
  startAll() {
    this.agents.forEach(a => this.start(a.id));
  }
  resetAll() {
    this.agents = AGENT_DEFS.map(createAgent);
    this.tasks = [];
  }

  createTask(agentId: string, description: string): Task {
    const t: Task = { id: id(), agentId, description, status: "queued", createdAt: now() };
    this.tasks.push(t);
    return t;
  }
}

export const store = new AgentStore();

/** Task pools — varied per ULTRONOS agent */
const TASK_POOLS: Record<string, string[]> = {
  trend:   ["Scraping etsy comp set", "Indexing 142 trending listings", "Pulling top tags from arxiv"],
  ideas:   ["Drafting 'moon ritual v3' concept", "Brainstorming birthstone bundle", "Pitching minimalist witch pack"],
  script:  ["Writing 'Lunar Affirmations 3.0' copy", "Drafting voiceover for ritual deck", "Polishing product description"],
  image:   ["Rendering cover art 9/12", "Generating mockup batch #67", "Compositing tarot card variants"],
  listing: ["Assembling SKU MN-LR-014", "Building Printify product entry", "Wiring variants & pricing"],
  seo:     ["Optimizing title for +18% CTR", "Researching long-tail keywords", "Tagging witchy/tarot/moon"],
  qa:      ["31-point compliance pass", "Flagging blurry mockup batch", "Reviewing draft listings"],
  publish: ["Pushing Velvet Tarot Deck → live", "Promoting hoodie variant to Etsy", "Cutting v9.4.3 release"],
  msg:     ["Responding to 3 tickets", "Processing 1 refund request", "Drafting reply to slack thread"],
  sales:   ["Generating weekly report", "Computing 24h revenue delta", "Flagging conversion drop"],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(a: number, b: number) { return a + Math.random() * (b - a); }

export function tickSimulator() {
  for (const a of store.agents) {
    if (!a.active) continue;
    // Astra (trend) is driven by real AI when result is present — don't overwrite it
    if (a.id === "trend" && a.result) continue;

    switch (a.status) {
      case "idle":
        a.currentTask = pick(TASK_POOLS[a.id] ?? ["working..."]);
        a.progress = 0;
        a.status = "thinking";
        store.log(a.id, "Thinking about: " + a.currentTask);
        break;
      case "thinking":
        a.progress += rand(3, 7);
        if (a.progress >= 15) {
          a.status = "working";
          a.progress = 15;
          store.log(a.id, "Working: " + a.currentTask);
        }
        break;
      case "working":
        a.progress += rand(1.5, 4.5);
        if (a.progress >= 100) {
          a.progress = 100;
          a.status = Math.random() < 0.06 ? "error" : "complete";
          store.log(
            a.id,
            a.status === "error" ? "Errored: " + a.currentTask : "Completed: " + a.currentTask,
            a.status === "error" ? "err" : "ok",
          );
        }
        break;
      case "complete":
        a.status = "idle";
        a.progress = 0;
        a.currentTask = null;
        break;
      case "error":
        break;
      case "waiting":
        a.status = "working";
        break;
    }
    a.updatedAt = now();
  }
}
