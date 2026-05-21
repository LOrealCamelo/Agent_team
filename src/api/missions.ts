/**
 * Missions endpoint — derives "Active Missions" from the Projects tab of the
 * UltronOS Command Center Google Sheet. This is the dashboard's view of
 * L'Oreal's real projects (Cheat Code PDF, Sticker Vault 500, etc).
 *
 * Sheet schema (Projects tab):
 *   Project_ID | Project_Name | Status | Owner_Agent | Deadline | Priority | Revenue_Goal | Notes
 *
 * Status is stored either as a percentage ("95%") or a label ("Done", "In Progress").
 * We parse percent values; non-percent statuses default to 0.
 */

import { getRows, TABS } from "../lib/sheets";

export interface Mission {
  id: string;            // Project_ID, slugified
  projectId: string;     // raw Project_ID (e.g. "NSM-001")
  title: string;         // Project_Name
  status: string;        // raw Status string
  progress: number;      // 0–100, parsed from Status
  ownerAgent: string;    // Owner_Agent column
  deadline: string;
  priority: string;
  revenueGoal: number;   // Revenue_Goal parsed to number
  notes: string;
}

function parsePercent(s: string): number {
  if (!s) return 0;
  const m = s.match(/(\d+(?:\.\d+)?)\s*%/);
  if (m) return Math.min(100, Math.max(0, Number(m[1])));
  if (/done|complete|shipped/i.test(s)) return 100;
  if (/blocked|stuck/i.test(s)) return 0;
  return 0;
}

function parseRevenue(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[$,]/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Cache the Sheet read for 30s — the Sheet is the source of truth but the
 * dashboard polls every 30s anyway, no need to hammer Google.
 */
let cache: { ts: number; missions: Mission[] } | null = null;
const TTL_MS = 30_000;

export async function getMissions(force = false): Promise<Mission[]> {
  if (!force && cache && Date.now() - cache.ts < TTL_MS) return cache.missions;

  const rows = await getRows(TABS.projects);
  const missions: Mission[] = rows
    .filter(r => r && r[0]) // skip empty rows
    .map((r): Mission => ({
      id: slug(r[0]),
      projectId: r[0] || "",
      title: r[1] || "(untitled project)",
      status: r[2] || "",
      progress: parsePercent(r[2] || ""),
      ownerAgent: r[3] || "",
      deadline: r[4] || "",
      priority: r[5] || "",
      revenueGoal: parseRevenue(r[6] || ""),
      notes: r[7] || "",
    }));

  cache = { ts: Date.now(), missions };
  return missions;
}
