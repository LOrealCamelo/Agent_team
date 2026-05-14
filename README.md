# UltronOS — NeuroSpicy Mystic Agent Team

> © 2026 NeuroSpicy Mystic — All rights reserved. NeuroSpicy Mystic® trademark L'Oreal Venturini Camelo.

Background-worker agent team for NeuroSpicy Mystic®. Week 1 ships PM Agent (Master) controlling everything via Telegram bot `@NeuroSpicyCommanderBot`, with Google Sheets as the CRM.

## Status

| Week | Agent | State |
|---|---|---|
| **1** | **PM / Master** (Opus 4.7) | scaffolded — needs Render env + Google Sheet |
| 2 | Scribe (Sonnet 4.6) | not yet built |
| 2 | Researcher (Haiku 4.5 + Sonnet 4.6) | not yet built |
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
