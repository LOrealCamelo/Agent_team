import { callHaiku } from "./anthropic";
import { getRows, TABS } from "./sheets";
import { config } from "../config";

export interface HealthCheck {
  service: string;
  ok: boolean;
  detail: string;
}

export async function checkAnthropic(): Promise<HealthCheck> {
  try {
    const response = await callHaiku(
      "Reply with exactly one word: pong",
      "ping",
      16,
    );
    return {
      service: "Anthropic",
      ok: response.toLowerCase().includes("pong"),
      detail: response.split("\n")[0].slice(0, 40),
    };
  } catch (err) {
    return {
      service: "Anthropic",
      ok: false,
      detail: err instanceof Error ? err.message.slice(0, 80) : "unknown error",
    };
  }
}

export async function checkSheets(): Promise<HealthCheck> {
  try {
    const tasks = await getRows(TABS.tasks);
    return {
      service: "Google Sheets",
      ok: true,
      detail: `${tasks.length} task rows in sheet ${config.googleSheetId.slice(0, 12)}...`,
    };
  } catch (err) {
    return {
      service: "Google Sheets",
      ok: false,
      detail: err instanceof Error ? err.message.slice(0, 100) : "unknown error",
    };
  }
}

export async function runAllChecks(): Promise<HealthCheck[]> {
  return Promise.all([checkAnthropic(), checkSheets()]);
}

export function formatHealthReport(checks: HealthCheck[]): string {
  const lines = checks.map(
    (c) => `${c.ok ? "🟢" : "🔴"} ${c.service}: ${c.detail}`,
  );
  const allOk = checks.every((c) => c.ok);
  return (
    `${allOk ? "🟢 UltronOS online" : "🔴 UltronOS has issues"}\n\n` +
    lines.join("\n") +
    `\n\nTimezone: ${config.timezone}\nCrons: 7am Researcher · 8am PM\n\n47620`
  );
}
