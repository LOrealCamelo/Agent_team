/**
 * In-memory agent state for the dashboard API.
 * Mock-first: no DB, no real agent execution (except Research Agent in research.ts).
 *
 * Mirrors the schema the frontend expects.
 */

export type AgentStatus =
  | "idle"
  | "thinking"
  | "working"
  | "waiting"
  | "complete"
  | "error";

export interface AgentLog {
  timestamp: string; // ISO
  message: string;
  level: "info" | "ok" | "warn" | "err";
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTask: string | null;
  progress: number; // 0–100
  lastAction: string;
  logs: AgentLog[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  result?: unknown; // populated by Research Agent in Phase 3
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

const AGENT_DEFS: Array<{ id: string; name: string; role: string }> = [
  { id: "research", name: "Research Agent", role: "Scanning sources & gathering context" },
  { id: "plan", name: "Planning Agent", role: "Architecting solutions & breaking down work" },
  { id: "code", name: "Code Agent", role: "Writing & refactoring code" },
  { id: "test", name: "Test Agent", role: "Running & writing test suites" },
  { id: "qa", name: "QA Agent", role: "Reviewing PRs & validating quality" },
  { id: "deploy", name: "Deploy Agent", role: "Deploying releases to production" },
  { id: "voice", name: "Voice Agent", role: "Listening & responding on phone channels" },
  { id: "chatbot", name: "Chatbot Agent", role: "Conversational AI on web & messaging" },
  { id: "analytics", name: "Analytics Agent", role: "Insights, reports & monitoring" },
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
    const t: Task = {
      id: id(),
      agentId,
      description,
      status: "queued",
      createdAt: now(),
    };
    this.tasks.push(t);
    return t;
  }
}

export const store = new AgentStore();

/**
 * Mock simulator — drives agent state forward like the frontend does, but
 * server-side so the dashboard can poll and see live changes.
 * Disabled until at least one agent is started.
 */
const TASK_POOLS: Record<string, string[]> = {
  research: ["Indexing 142 docs", "Cross-referencing repos", "Summarizing changelogs"],
  plan: ["Drafting architecture", "Breaking down tickets", "Sequencing pipeline"],
  code: ["Implementing endpoint", "Refactoring session store", "Patching middleware"],
  test: ["Running jest suite", "Playwright e2e", "Fuzz testing endpoint"],
  qa: ["Reviewing PR", "Auditing accessibility", "Verifying spec compliance"],
  deploy: ["Rolling canary", "Promoting to staging", "Cutting hotfix"],
  voice: ["Handling inbound call", "Transcribing voicemail", "Routing escalation"],
  chatbot: ["Resolving conversation", "Updating intent classifier", "Drafting reply"],
  analytics: ["Generating weekly report", "Computing funnel", "Flagging anomaly"],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(a: number, b: number) { return a + Math.random() * (b - a); }

export function tickSimulator() {
  for (const a of store.agents) {
    if (!a.active) continue;
    // Research Agent is driven by real AI calls in Phase 3 — skip its sim
    // once a result has been attached (we don't want to overwrite it).
    if (a.id === "research" && a.result) continue;

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
        // Loop after brief dwell — set progress to 0 + back to idle next tick
        a.status = "idle";
        a.progress = 0;
        a.currentTask = null;
        break;
      case "error":
        // Stay until explicit start/reset
        break;
      case "waiting":
        a.status = "working";
        break;
    }
    a.updatedAt = now();
  }
}
