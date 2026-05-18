# UltronOS — NeuroSpicy Mystic Agent Team

> © 2026 NeuroSpicy Mystic — All rights reserved. NeuroSpicy Mystic® trademark L'Oreal Venturini Camelo.

Background-worker agent team for NeuroSpicy Mystic®. Week 1 ships PM Agent (Master) controlling everything via Telegram bot `@NeuroSpicyCommanderBot`, with Google Sheets as the CRM.

## Status

| Week | Agent | State |
|---|---|---|
| **1** | **PM / Master** (Opus 4.7) | shipped — `/today`, `/braindump`, `/done`, `/snooze`, 8am cron |
| **2** | **Scribe** (Sonnet 4.6) | shipped — `/scribe <DM>` drafts reply, escalates on safety triggers |
| **2** | **Researcher** (Sonnet 4.6) | shipped — `/research` + 7am cron drops Live pack (3 topics + cited stat) |
| 3 | Content Creator (Sonnet 4.6) | not yet built |
| 3 | Poster (Haiku 4.5) | not yet built |
| 4 | Product Manager (Sonnet 4.6) | not yet built |
| 4 | Marketing Council (Opus 4.7) | not yet built |
| 5 | Sales (Sonnet 4.6) | not yet built |
| 5 | Inbound Voice "Djinn" (Vapi + ElevenLabs) | not yet built |
| 6 | Outbound Voice (Vapi + ElevenLabs) | not yet built |

## Setup

See [`docs/SETUP.md`](docs/SETUP.md) for step-by-step deploy.

## Architecture

- **Runtime:** Node 20 + TypeScript, Render Background Worker
- **Bot:** grammy (Telegram)
- **LLM:** Anthropic SDK (Opus 4.7 / Sonnet 4.6 / Haiku 4.5)
- **CRM:** Google Sheets (`UltronOS_Command_Center_NeuroSpicy`)
- **Scheduler:** node-cron, America/New_York
- **Posting (later):** Make.com webhooks
- **Voice (later):** Vapi + ElevenLabs

## Global agent rules (baked into every output)

1. Never mention being AI.
2. Every output ends with `47620`.
3. Money-touching tasks cite proof.
4. Suicide/self-harm → 988 link + escalate, no AI advice.
5. All listings include copyright footer.

---

## Dashboard API (separate process, optional)

There's a standalone HTTP API server that backs the **AI Agent Operations Hub
dashboard** (see [`LOrealCamelo/dashboard_matrix`](https://github.com/LOrealCamelo/dashboard_matrix)).
It runs independently from the cron/telegram worker — does not touch any of
the shipped agent code.

```bash
npm install
npm run api      # → http://localhost:3000
```

### Endpoints

| Method | Path                          | What it does                                |
|-------:|-------------------------------|---------------------------------------------|
| GET    | `/api/health`                 | Liveness probe                              |
| GET    | `/api/agents`                 | Full state of all 9 agents                  |
| GET    | `/api/agents/status`          | Trimmed status snapshot (poll this)         |
| GET    | `/api/agents/:id`             | One agent                                   |
| GET    | `/api/agents/:id/logs`        | One agent's log ring buffer                 |
| POST   | `/api/agents/start`           | Start all (mock state machine)              |
| POST   | `/api/agents/pause`           | Pause all                                   |
| POST   | `/api/agents/reset`           | Reset all to idle                           |
| POST   | `/api/agents/:id/start`       | Start one. **Research = real Claude call.** |
| POST   | `/api/agents/:id/stop`        | Stop one                                    |
| GET    | `/api/logs?limit=100`         | Flat global log feed (newest first)         |
| POST   | `/api/tasks`                  | Queue a task `{ agentId, description }`     |
| GET    | `/api/tasks`                  | List queued tasks                           |

### Research Agent (Phase 3 — real AI)

`POST /api/agents/research/start` calls Claude (`claude-haiku-4-5-20251001`
by default — override with `ANTHROPIC_MODEL`) and returns 10 Etsy digital
product ideas as a JSON array. Each idea: `{title, description, target_audience, estimated_price_range}`.

API key comes from `ANTHROPIC_API_KEY` in `.env` — never hardcoded.

### Files

- `src/api-server.ts` — Express entry point, port 3000
- `src/api/state.ts` — in-memory agent store + mock state machine
- `src/api/routes.ts` — all HTTP handlers
- `src/api/research.ts` — Anthropic SDK call for Research Agent
