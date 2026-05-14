import { callSonnet } from "../lib/anthropic";
import { BRAND_VOICE_PREFIX, ENERGY_ANCHOR, ensureAnchor } from "../lib/brand";
import { appendRow, TABS } from "../lib/sheets";

const RESEARCHER_SYSTEM_PROMPT = `${BRAND_VOICE_PREFIX}

YOUR JOB AS RESEARCHER
You give L'Oreal what she needs to go LIVE on TikTok with confidence: 3 topics, 3 hooks, 1 cited stat. No fluff, no ambiguity.

NICHE
Witchy + ADHD/neurodivergent + women's empowerment + tarot + manifestation + nervous system care.

OUTPUT FORMAT (REQUIRED)
🔮 TODAY'S LIVE PACK | {date}

3 TOPICS (with hook):
1. {topic} — Hook: "{hook line}"
2. {topic} — Hook: "{hook line}"
3. {topic} — Hook: "{hook line}"

📊 CITE THIS ON CAMERA:
{one-line stat with source name + year}

🌙 ALERT: {only include this line if "moon phase", "retrograde", "full moon", "eclipse", or similar is currently culturally trending — frame it as a ritual opportunity}

${ENERGY_ANCHOR}

CONSTRAINTS
- Stat MUST cite a real source + year (CDC, NIH, ADAA, Pew, Edison Research, Statista, etc.). Don't invent stats.
- Topics must be SPECIFIC enough to film today, not "talk about ADHD" — instead "the 3 ADHD planner mistakes neurodivergent witches make".
- Hooks must be ≤12 words. Spoken aloud = ≤3 seconds.
- Never mention being AI.`;

export async function generateLivePack(trendsContextNote?: string): Promise<string> {
  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  const userPrompt = `Generate today's TikTok Live pack for L'Oreal (NeuroSpicy Mystic).

Date: ${date}

${trendsContextNote ? `Trend signal context (use it):\n${trendsContextNote}\n` : "(No trend signal feed wired yet — work from your knowledge of evergreen witchy/ADHD/neurodivergent topics that perform on TikTok in 2026.)"}

Output the LIVE PACK in the exact format from your system prompt. Stat must be real and cited.`;

  const pack = await callSonnet(RESEARCHER_SYSTEM_PROMPT, userPrompt, 768);

  await appendRow(TABS.agentLog, [
    new Date().toISOString(),
    "Researcher",
    "Generated Live Pack",
    `3 topics + 1 stat for ${date}`,
    "+15",
  ]);

  return pack;
}

export function isMoonOrRetrogradeAlert(text: string): boolean {
  return /\b(moon phase|full moon|new moon|retrograde|eclipse|solstice|equinox)\b/i.test(text);
}
