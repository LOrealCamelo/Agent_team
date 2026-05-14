import cron from "node-cron";
import { config } from "./config";
import { bot, mitButtons, sendToCommander } from "./lib/telegram";
import {
  generateTopMITsMessage,
  markTaskDone,
  snoozeTask,
  triageBrainDump,
} from "./agents/pm";
import { draftDmReply, flagSafetyEscalation } from "./agents/scribe";
import { generateLivePack } from "./agents/researcher";
import { formatHealthReport, runAllChecks } from "./lib/health";

const SAFETY_TRIGGERS = /\b(suicide|kill myself|want to die|end it all|self[\s-]?harm|hurt myself)\b/i;

bot.command("start", async (ctx) => {
  await ctx.reply(
    "🔮 NeuroSpicy Commander online.\n\nCommands:\n/today — get today's MITs\n/braindump — paste your chaos, I triage\n/scribe — draft a DM reply\n/research — today's TikTok Live pack\n/done /snooze — task actions\n/help — this list\n\n47620",
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "Commands:\n/today — top 3 MITs\n/braindump <text> — Eisenhower triage in 10s\n/scribe <dm text> — Scribe drafts a reply\n/research — today's Live pack (3 topics + 1 stat)\n/done <task_id> /snooze <task_id>\n/status — health check of every service\n\n47620",
  );
});

bot.command("status", async (ctx) => {
  await ctx.reply("Pinging services... 5sec.\n\n47620");
  const checks = await runAllChecks();
  await ctx.reply(formatHealthReport(checks));
});

bot.command("today", async (ctx) => {
  const { text, taskIds } = await generateTopMITsMessage();
  await ctx.reply(text, { reply_markup: mitButtons(taskIds) });
});

bot.command("braindump", async (ctx) => {
  const dump = ctx.match;
  if (!dump || dump.trim().length === 0) {
    await ctx.reply("Send it. /braindump followed by whatever's in your head.\n\n47620");
    return;
  }
  await ctx.reply(await triageBrainDump(dump));
});

bot.command("scribe", async (ctx) => {
  const dm = ctx.match;
  if (!dm || dm.trim().length === 0) {
    await ctx.reply("Paste the DM. /scribe <DM text>\n\n47620");
    return;
  }
  if (SAFETY_TRIGGERS.test(dm)) {
    await ctx.reply(await flagSafetyEscalation(dm));
    return;
  }
  const draft = await draftDmReply(dm);
  await ctx.reply(`📝 SCRIBE DRAFT:\n\n${draft}`);
});

bot.command("research", async (ctx) => {
  await ctx.reply("Pulling Live pack... give me 10sec.\n\n47620");
  const pack = await generateLivePack();
  await ctx.reply(pack);
});

bot.command("done", async (ctx) => {
  const taskId = ctx.match?.trim();
  if (!taskId) {
    await ctx.reply("Which task? /done T-1001\n\n47620");
    return;
  }
  await ctx.reply(await markTaskDone(taskId));
});

bot.command("snooze", async (ctx) => {
  const taskId = ctx.match?.trim();
  if (!taskId) {
    await ctx.reply("Which task? /snooze T-1001\n\n47620");
    return;
  }
  await ctx.reply(await snoozeTask(taskId));
});

bot.callbackQuery(/^done:(.+)$/, async (ctx) => {
  const taskId = ctx.match[1];
  await ctx.answerCallbackQuery();
  await ctx.reply(await markTaskDone(taskId));
});

bot.callbackQuery(/^snooze:(.+)$/, async (ctx) => {
  const taskId = ctx.match[1];
  await ctx.answerCallbackQuery();
  await ctx.reply(await snoozeTask(taskId));
});

bot.callbackQuery("brain_dump", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("Drop it. Reply with /braindump <your chaos>.\n\n47620");
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return;
  if (SAFETY_TRIGGERS.test(text)) {
    await ctx.reply(await flagSafetyEscalation(text));
    return;
  }
  await ctx.reply(await triageBrainDump(text));
});

cron.schedule(
  "0 7 * * *",
  async () => {
    try {
      const pack = await generateLivePack();
      await sendToCommander(`☕ 7am — Researcher just dropped today's Live pack.\n\n${pack}`);
    } catch (err) {
      console.error("7am Researcher push failed:", err);
    }
  },
  { timezone: config.timezone },
);

cron.schedule(
  "0 8 * * *",
  async () => {
    try {
      const { text, taskIds } = await generateTopMITsMessage();
      await sendToCommander(text, mitButtons(taskIds));
    } catch (err) {
      console.error("8am MIT push failed:", err);
      await sendToCommander(
        `⚠️ PM agent couldn't ship today's MITs. Error: ${err instanceof Error ? err.message : String(err)}\n\n47620`,
      );
    }
  },
  { timezone: config.timezone },
);

bot.start({
  onStart: async (botInfo) => {
    console.log(`UltronOS online as @${botInfo.username}`);
    console.log(`Cron: 7am Researcher + 8am PM (${config.timezone})`);
    console.log(`Agents wired: PM (Opus 4.7), Scribe (Sonnet 4.6), Researcher (Sonnet 4.6)`);
    try {
      const checks = await runAllChecks();
      await sendToCommander(
        `🚀 UltronOS just deployed — boot health check:\n\n${formatHealthReport(checks).split("\n").slice(2).join("\n")}`,
      );
    } catch (err) {
      console.error("Startup ping failed:", err);
    }
  },
});

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
