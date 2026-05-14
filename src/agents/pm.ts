import { callOpus } from "../lib/anthropic";
import { BRAND_VOICE_PREFIX, ENERGY_ANCHOR, ensureAnchor } from "../lib/brand";
import { appendRow, getRows, TABS, updateCell } from "../lib/sheets";

const PM_SYSTEM_PROMPT = `${BRAND_VOICE_PREFIX}

YOUR JOB AS PM
- Triage tasks using the Eisenhower Matrix (Urgent × Important).
- Protect L'Oreal's ADHD: max 3 MITs per day. Easier tasks first if her energy is low.
- Surface the dopamine hit on every task — say WHY it matters in one short line.
- Flag bottlenecks: "you can't film until stickers batch 1 done".
- Never lecture. Never preach. Receipts only.

OUTPUT — 8AM MIT MESSAGE
🔮 COMMANDER DASHBOARD | {date}
Top 3 MITs Today:
1. [ ] {task} [{time_block}] - {dopamine_hit}
2. [ ] ...
3. [ ] ...

Energy: {N}/5 today = do #{N} first. {one-line why}.

${ENERGY_ANCHOR}

OUTPUT — BRAIN DUMP TRIAGE (respond fast, conversational)
Heard. {ADHD-aware reframe}.
{Cancelling/Reordering action}.
New plan:
1. {smallest possible next step} [{time}]

That's the whole mission. You safe?
${ENERGY_ANCHOR}

OUTPUT — DONE CONFIRMATION
MISSION COMPLETE +25XP 🎉
{Project}: UNBLOCKED
Next: {next task}. But only if you want.
${ENERGY_ANCHOR}`;

interface Task {
  id: string;
  projectId: string;
  name: string;
  status: string;
  dueDate: string;
  mitToday: boolean;
  agent: string;
  energyLevel: number;
  dopamineHit: string;
  rowIndex: number;
}

function parseTasks(rows: string[][]): Task[] {
  return rows.map((r, i) => ({
    id: r[0] || "",
    projectId: r[1] || "",
    name: r[2] || "",
    status: r[3] || "",
    dueDate: r[4] || "",
    mitToday: (r[5] || "").toUpperCase() === "YES",
    agent: r[6] || "",
    energyLevel: Number((r[7] || "0").split("/")[0]) || 0,
    dopamineHit: r[8] || "",
    rowIndex: i + 2,
  }));
}

export async function generateTopMITsMessage(): Promise<{ text: string; taskIds: string[] }> {
  const rows = await getRows(TABS.tasks);
  const tasks = parseTasks(rows);
  const todaysMITs = tasks
    .filter((t) => t.mitToday && t.status.toLowerCase() !== "done")
    .sort((a, b) => a.energyLevel - b.energyLevel)
    .slice(0, 3);

  if (todaysMITs.length === 0) {
    return {
      text: ensureAnchor(
        "🔮 COMMANDER DASHBOARD\n\nNo MITs flagged for today. Drop a /braindump and I'll triage.",
      ),
      taskIds: [],
    };
  }

  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  const lines = todaysMITs.map(
    (t, i) => `${i + 1}. [ ] ${t.name} - ${t.dopamineHit || "ship it"}`,
  );

  const text =
    `🔮 COMMANDER DASHBOARD | ${date}\n` +
    `Top 3 MITs Today:\n` +
    lines.join("\n") +
    `\n\nDo #1 first. It's the easiest lift today.\n\n${ENERGY_ANCHOR}`;

  await appendRow(TABS.agentLog, [
    new Date().toISOString(),
    "PM",
    "Sent MITs",
    `${todaysMITs.length} tasks to Telegram`,
    "+10",
  ]);

  return { text, taskIds: todaysMITs.map((t) => t.id) };
}

export async function triageBrainDump(dump: string): Promise<string> {
  const userPrompt = `L'Oreal just dumped this on you:

"${dump}"

Triage using Eisenhower. Cancel anything not urgent + important. Pick the SMALLEST possible next step she can do right now (≤15min). Respond in the brain-dump format from your system prompt. Conversational. Real. No AI tone.`;

  const response = await callOpus(PM_SYSTEM_PROMPT, userPrompt, 512);

  await appendRow(TABS.brainDump, [
    new Date().toISOString(),
    dump,
    response,
    "",
  ]);

  return response;
}

export async function markTaskDone(taskId: string): Promise<string> {
  const rows = await getRows(TABS.tasks);
  const tasks = parseTasks(rows);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    return ensureAnchor(`Couldn't find ${taskId}, babe. Check your sheet.`);
  }

  await updateCell(TABS.tasks, `D${task.rowIndex}`, "Done");
  await appendRow(TABS.agentLog, [
    new Date().toISOString(),
    "L'Oreal",
    `/done ${taskId}`,
    `${task.name} unblocked`,
    "+25",
  ]);

  const nextTask = tasks
    .filter((t) => t.mitToday && t.status.toLowerCase() !== "done" && t.id !== taskId)
    .sort((a, b) => a.energyLevel - b.energyLevel)[0];

  const nextLine = nextTask
    ? `Next: ${nextTask.name}. But only if you want.`
    : `That's the last MIT. Rest is allowed.`;

  return ensureAnchor(
    `MISSION COMPLETE +25XP 🎉\n${task.projectId}: UNBLOCKED\n${nextLine}`,
  );
}

export async function snoozeTask(taskId: string): Promise<string> {
  const rows = await getRows(TABS.tasks);
  const tasks = parseTasks(rows);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    return ensureAnchor(`Couldn't find ${taskId}, babe.`);
  }

  await updateCell(TABS.tasks, `F${task.rowIndex}`, "NO");
  await appendRow(TABS.agentLog, [
    new Date().toISOString(),
    "L'Oreal",
    `/snooze ${taskId}`,
    `${task.name} pushed off MIT list`,
    "+0",
  ]);

  return ensureAnchor(`Snoozed. Off your plate today. Tomorrow's problem.`);
}
