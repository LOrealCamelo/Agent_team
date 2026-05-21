/**
 * In-memory agent state for the dashboard API.
 * Real roster — 10 NeuroSpicy Mystic agents per Master Spec + Training Manual.
 * Three are real (PM/Scribe/Researcher run on the worker — see src/agents/);
 * seven are scheduled future weeks and run on a placeholder simulator until built.
 *
 * Cross-process note: worker writes do NOT reach this store today (worker and
 * web are separate Render processes). Postgres bridge is the next session.
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
  /** true once the real worker-side agent is built; false = still simulator-only */
  built: boolean;
  status: AgentStatus;
  currentTask: string | null;
  progress: number;
  lastAction: string;
  logs: AgentLog[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  result?: unknown;
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
 * NeuroSpicy Mystic roster — 10 agents per Master Spec + Training Manual.
 * Real (running on worker): pm, scribe, researcher
 * Stubbed (simulator only until built): content, poster, product, marketing, sales, djinn, outbound
 */
const AGENT_DEFS: Array<{ id: string; name: string; role: string; built: boolean }> = [
  { id: "pm",          name: "PM",          role: "Master Strategist — daily Top-3 MITs, brain-dump triage, Eisenhower routing", built: true },
  { id: "scribe",      name: "Scribe",      role: "DM Drafter — IG/TikTok reply drafts in L'Oreal's voice, Telegram-approved",  built: true },
  { id: "researcher",  name: "Researcher",  role: "Trend Hunter — daily 8am pull: top live topics + hooks + cited stat",         built: true },
  { id: "content",     name: "Content",     role: "Content Creator — TikTok scripts, IG carousels, email drafts via Canva",      built: false },
  { id: "poster",      name: "Poster",      role: "Publish Schedule — Make.com pushes approved posts at 7pm EST",                 built: false },
  { id: "product",     name: "Product",     role: "Listing Manager — Etsy / Stan / TikTok Shop batch listings via API",           built: false },
  { id: "marketing",   name: "Marketing",   role: "Ads Council — $20/day Meta spend, ROAS reports, kill/scale calls",             built: false },
  { id: "sales",       name: "Sales",       role: "Revenue Recovery — Stripe abandoned-cart, Klaviyo follow-ups, 48hr upsell",    built: false },
  { id: "djinn",       name: "Djinn",       role: "Inbound Voice — Vapi + ElevenLabs phone agent, refunds, bookings",             built: false },
  { id: "outbound",    name: "Outbound",    role: "Outbound Voice — 30-day post-purchase check-ins, May Kit offer",               built: false },
];

function createAgent(def: { id: string; name: string; role: string; built: boolean }): Agent {
  const t = now();
  return {
    id: def.id,
    name: def.name,
    role: def.role,
    built: def.built,
    status: "idle",
    currentTask: null,
    progress: 0,
    lastAction: def.built ? "Online — running on worker" : "Scheduled — not yet built",
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

/** Task pools — contextual to each NeuroSpicy agent's real job */
const TASK_POOLS: Record<string, string[]> = {
  pm:         ["Triage brain dump → Top 3 MITs", "Building dependency map for May Kit", "Eisenhower-sorting 14 backlog items", "Drafting 8am MIT message", "Auditing burndown for Week 4"],
  scribe:     ["Drafting 5 IG DM replies", "Flagging urgent: collab >10k followers", "Auto-sending Cheat Code link to 'spell' trigger", "Approving Telegram reply queue", "Drafting TikTok comment thread responses"],
  researcher: ["Pulling top 10 TikTok 'witchy' trends", "Indexing Etsy 'ADHD planner' searches", "Cited stat: ADHD diagnosis rates", "Alert: 'mercury retrograde' trending +340%", "Compiling 3 hooks for tonight's Live"],
  content:    ["Generating TikTok script: Rose Petal Wax", "Building IG carousel 10/10 slides", "Drafting email: 'Cheat Code drops Friday'", "Pulling brand photos from URL list", "Composing Canva mockup via API"],
  poster:     ["Scheduling 7pm EST post → IG", "Pushing carousel to TikTok with UTM", "Cross-posting to FB business page", "Confirming Make.com webhook", "Replying 'Posted' to PM channel"],
  product:    ["Listing Sticker Vault 500-pack on Etsy", "Building TikTok Shop 50-pack variant", "Generating 3 mockups via Canva API", "Wiring Stan digital-product automation", "Pricing audit: $9 vs $19 Digital tier"],
  marketing:  ["Running Council on $20/day spend", "ROAS report: Cheat Code freebie funnel", "Kill/scale call: May Kit ad creative #3", "Drafting FB ad copy: tarot + ADHD interest", "Building funnel: Freebie → Vault → Kit"],
  sales:      ["Stripe webhook: cart abandoned 1hr ago", "Klaviyo: drafting 48hr Vault upsell", "Weekly revenue by product report", "Case study email: '3 deposits proof'", "Computing 7-day revenue delta"],
  djinn:      ["Answering inbound: refund request <$27", "Booking tarot reading via Calendly API", "Sending Cheat Code link to caller", "FAQ: 'where's my sticker download'", "Escalating medical question to L'Oreal"],
  outbound:   ["Calling buyer 30 days post-Vault", "May Kit $27 offer to past customer", "Logging testimonial: 'rose petal worked'", "Troubleshoot: PDF not downloading", "Daily quota: 14 of 50 calls placed"],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(a: number, b: number) { return a + Math.random() * (b - a); }

export function tickSimulator() {
  for (const a of store.agents) {
    if (!a.active) continue;
    // Researcher is driven by real AI when result is present — don't overwrite it
    if (a.id === "researcher" && a.result) continue;

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
