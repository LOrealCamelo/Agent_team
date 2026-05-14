import { Bot, InlineKeyboard } from "grammy";
import { config } from "../config";

export const bot = new Bot(config.telegramBotToken);

bot.use(async (ctx, next) => {
  if (ctx.from?.id !== config.telegramUserId) {
    return;
  }
  await next();
});

export function mitButtons(taskIds: string[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const id of taskIds) {
    kb.text(`✅ Done ${id}`, `done:${id}`)
      .text(`💤 Snooze ${id}`, `snooze:${id}`)
      .row();
  }
  kb.text("🧠 Brain Dump", "brain_dump");
  return kb;
}

export async function sendToCommander(message: string, keyboard?: InlineKeyboard): Promise<void> {
  await bot.api.sendMessage(config.telegramUserId, message, {
    reply_markup: keyboard,
  });
}
