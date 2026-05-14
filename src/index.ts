import cron from "node-cron";
import { config } from "./config";
import { bot, mitButtons, sendToCommander } from "./lib/telegram";
import {
  generateTopMITsMessage,
  markTaskDone,
  snoozeTask,
  triageBrainDump,
} from "./agents/pm";

bot.command("start", async (ctx) => {
  await ctx.reply(
    "🔮 NeuroSpicy Commander online.\n\nCommands:\n/today — get today's MITs\n/braindump — paste your chaos, I triage\n/help — this list\n\n47620",
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "Commands:\n/today — top 3 MITs from your sheet\n/braindump <text> — I triage in 10s\n/done <task_id> — mark done\n/snooze <task_id> — push off today\n\n47620",
  );
});

bot.command("today", async (ctx) => {
  const { text, taskIds } = await generateTopMITsMessage();
  await ctx.reply(text, { reply_markup: mitButtons(taskIds) });
});

bot.command("braindump", async (ctx) => {
  const dump = ctx.match;
  if (!dump || dump.trim().length === 0) {
    await ctx.reply(
      "Send it. /braindump followed by whatever's in your head.\n\n47620",
    );
    return;
  }
  const response = await triageBrainDump(dump);
  await ctx.reply(response);
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
  await ctx.reply(
    "Drop it. Reply with /braindump <your chaos>.\n\n47620",
  );
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return;
  const response = await triageBrainDump(text);
  await ctx.reply(response);
});

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
  onStart: (botInfo) => {
    console.log(`UltronOS PM agent online as @${botInfo.username}`);
    console.log(`Cron: 8am ${config.timezone} daily MIT push`);
  },
});

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
