import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  telegramUserId: Number(required("TELEGRAM_USER_ID")),
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  googleOAuthClientId: required("GOOGLE_OAUTH_CLIENT_ID"),
  googleOAuthClientSecret: required("GOOGLE_OAUTH_CLIENT_SECRET"),
  googleOAuthRefreshToken: required("GOOGLE_OAUTH_REFRESH_TOKEN"),
  googleSheetId: required("GOOGLE_SHEET_ID"),
  timezone: process.env.TIMEZONE || "America/New_York",
} as const;

export const models = {
  master: "claude-opus-4-7",
  highVolume: "claude-sonnet-4-6",
  routing: "claude-haiku-4-5-20251001",
} as const;
