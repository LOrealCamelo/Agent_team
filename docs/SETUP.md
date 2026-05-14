# UltronOS PM Agent — Setup

Owner: L'Oreal Venturini Camelo. Goal: 8am Telegram message with Top 3 MITs by tomorrow.

## 1. Create the Google Sheet (5 min)

1. Go to drive.google.com → New → Google Sheets
2. Name it: `UltronOS_Command_Center_NeuroSpicy`
3. Leave it with one blank tab (the init script will create the other 4)
4. Copy the **Sheet ID** from the URL: `docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

## 2. Create a Google Service Account (5 min)

1. console.cloud.google.com → select your **NeuroSpicy-CEO** project (or create one)
2. APIs & Services → Library → search "Google Sheets API" → **Enable**
3. IAM & Admin → Service Accounts → **Create Service Account**
   - Name: `ultronos-pm-agent`
   - Skip role grants (we grant on the sheet directly)
4. Click the new service account → Keys → Add Key → Create New Key → **JSON**
5. Save the downloaded JSON. The `client_email` field looks like `ultronos-pm-agent@your-project.iam.gserviceaccount.com`
6. Open your Google Sheet → Share → paste that `client_email` → give **Editor** access

## 3. Create the Telegram Bot (2 min — skip if you already have @NeuroSpicyCommanderBot)

1. Telegram → search `@BotFather` → `/newbot` → name it `NeuroSpicyCommanderBot`
2. Copy the API token (looks like `123456789:AAH...`)
3. Get your own chat ID: message `@userinfobot`, copy the numeric ID

## 4. Get an Anthropic API key (2 min)

1. console.anthropic.com → Settings → API Keys → **Create Key**
2. Copy the key (`sk-ant-api03-...`)

## 5. Push this code to your GitHub repo

```bash
cd C:\Users\Owner\Dev_Projects\Projects_NeuroSpicy_Mystic\Agent_team
git add .
git commit -m "feat(pm): scaffold Week 1 PM agent + Google Sheets CRM + Telegram bot"
git push origin main
```

## 6. Deploy to Render (10 min)

1. render.com → switch to **NeuroSpicy** workspace (workspace 2)
2. New → **Background Worker** → connect the `Agent_team` GitHub repo
3. Render will read `render.yaml` and pre-fill the worker config
4. Add env vars (Render → your worker → Environment):
   - `TELEGRAM_BOT_TOKEN` — from step 3
   - `TELEGRAM_USER_ID` — your numeric chat ID from step 3
   - `ANTHROPIC_API_KEY` — from step 4
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — paste the **entire JSON** from step 2 as a single line. In the JSON, replace literal newlines in `private_key` with `\n`. Render's secret value field accepts the full string.
   - `GOOGLE_SHEET_ID` — from step 1
5. Deploy

## 7. Initialize the sheet (one-time)

Once deployed, open Render → Worker → Shell, then:

```bash
npm run init-sheet
```

This creates the 5 tabs (Projects, Tasks, Revenue, Agent_Log, Brain_Dump), seeds 4 active projects, and adds 3 sample tasks (2 flagged `MIT_Today=YES`).

## 8. Test

1. Open Telegram → message `@NeuroSpicyCommanderBot`:
   - `/start` — should reply with command list
   - `/today` — should send today's Top 3 MITs (you'll see T-1002 and T-1001 from the seed)
   - `/braindump overwhelmed need stickers but email too` — should reply with rerouted plan in <10s
   - Tap `✅ Done T-1002` button — should reply "MISSION COMPLETE +25XP" and update Sheet
2. Check the Google Sheet — `Agent_Log` tab should have new rows

## 9. Wait for 8am EST

The cron sends `Top 3 MITs` automatically every morning at 8:00 America/New_York.

## Acceptance test (what success looks like)

- ✅ 8am tomorrow you receive a Telegram message starting `🔮 COMMANDER DASHBOARD`
- ✅ You tap `✅ Done T-1002` → bot replies `MISSION COMPLETE +25XP 🎉`
- ✅ Open the sheet → `Tasks!D3` is now `Done`, `Agent_Log` has 2+ new rows
- ✅ All bot messages end with `47620`

## When things break

- Bot doesn't respond → check Render logs, confirm `TELEGRAM_BOT_TOKEN` and your `TELEGRAM_USER_ID` are correct (the bot ignores anyone else)
- Sheet writes fail → confirm you shared the sheet with the service account `client_email` as Editor
- Anthropic errors → confirm key is funded and the model `claude-opus-4-7` is available on your account

## What's next (Week 2)

Scribe + Researcher + ULTRONOS V1. See `README.md` status table.
