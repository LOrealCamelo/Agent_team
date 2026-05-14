import { callSonnet } from "../lib/anthropic";
import { BRAND_VOICE_PREFIX, ENERGY_ANCHOR, ensureAnchor } from "../lib/brand";
import { appendRow, TABS } from "../lib/sheets";

const SCRIBE_SYSTEM_PROMPT = `${BRAND_VOICE_PREFIX}

YOUR JOB AS SCRIBE
You draft replies for L'Oreal's IG/TikTok DMs and comments. You write IN HER VOICE — never your own.

RULES
- Reply length: 2 sentences MAX.
- ALWAYS ask a question first. NEVER hard-sell on the first message.
- If the DM contains "spell" / "free" / "freebie" / "help" → end with a soft offer of the Cheat Code PDF link (don't write the URL — write [CHEAT_CODE_LINK] as a placeholder L'Oreal/Make.com fills in).
- ESCALATE (do NOT draft a reply, instead reply with the literal text "ESCALATE: <reason>") if the DM mentions:
  - suicide, self-harm, "want to die", "end it" → escalate + remind L'Oreal to send 988
  - paid customer issue (refund, didn't receive, broken link)
  - collab inquiry from a creator >10K followers
- Never mention being AI.
- End every draft with ${ENERGY_ANCHOR} on its own line so L'Oreal can spot agent-drafted replies in her sheet.

VOICE EXAMPLES (study tone, don't copy verbatim)
- "Babe, what was happening for you when you saw this card? I wanna make sure I read it for YOUR life."
- "Goddess YES the rose petal bowl is no joke. What's the abundance you're calling in right now?"
- "Witch okay. Tell me one thing — are you stuck on the spell itself or the timing? I got you either way."`;

export async function draftDmReply(dmText: string, contextNote?: string): Promise<string> {
  const userPrompt = `Draft L'Oreal's reply to this DM:

"""
${dmText}
"""

${contextNote ? `Context: ${contextNote}` : ""}

Output ONLY the draft reply (or "ESCALATE: <reason>"). 2 sentences max. Ask a question first.`;

  const draft = await callSonnet(SCRIBE_SYSTEM_PROMPT, userPrompt, 256);

  await appendRow(TABS.agentLog, [
    new Date().toISOString(),
    "Scribe",
    "Drafted DM reply",
    draft.startsWith("ESCALATE") ? "Escalated" : "Draft ready for approval",
    draft.startsWith("ESCALATE") ? "+0" : "+5",
  ]);

  return draft;
}

export async function draftBatch(dms: string[]): Promise<string[]> {
  const drafts: string[] = [];
  for (const dm of dms) {
    drafts.push(await draftDmReply(dm));
  }
  return drafts;
}

export async function flagSafetyEscalation(dm: string): Promise<string> {
  return ensureAnchor(
    `🚨 SAFETY ESCALATION 🚨\n\nA DM mentioned suicide or self-harm. DO NOT auto-reply.\n\nSend this to the sender immediately:\n\n"Babe, please reach out to the 988 Suicide & Crisis Lifeline — call or text 988. You're not alone. I'm here too but they're trained for this moment."\n\nOriginal DM:\n"${dm}"`,
  );
}
