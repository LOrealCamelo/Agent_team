/**
 * KPI endpoint — surfaces the top-of-dashboard numbers for the v2 HUD.
 *
 * Sources:
 *   - Revenue: sum of Amount column on the Sheet Revenue tab
 *   - Orders: count of Revenue tab rows
 *   - Workflows running: count of agents with status='working'
 *   - Agents active: count of agents with active=true
 *   - System health: % of agents whose latest log isn't level='err'
 *
 * Reads are cached for 30s.
 */

import { getRows, TABS } from "../lib/sheets";
import { store } from "./state";

export interface Kpis {
  revenue: number;
  revenueDeltaPct: number;
  orders: number;
  ordersDelta: number;
  workflowsRunning: number;
  workflowsDelta: number;
  agentsActive: number;
  agentsTotal: number;
  systemHealthPct: number;
  systemHealthLabel: "Excellent" | "Good" | "Degraded";
  sourceTimestamp: string;
}

let cache: { ts: number; revenue: number; orders: number } | null = null;
const TTL_MS = 30_000;

async function readRevenueTab(): Promise<{ revenue: number; orders: number }> {
  if (cache && Date.now() - cache.ts < TTL_MS) return { revenue: cache.revenue, orders: cache.orders };
  let rows: string[][] = [];
  try {
    rows = await getRows(TABS.revenue);
  } catch (err) {
    // Sheet unreachable — return last cache if we have one, else zeros
    if (cache) return { revenue: cache.revenue, orders: cache.orders };
    return { revenue: 0, orders: 0 };
  }
  let total = 0;
  let count = 0;
  for (const r of rows) {
    if (!r || !r[3]) continue; // Amount column is index 3
    const amt = Number(String(r[3]).replace(/[$,]/g, "").trim());
    if (Number.isFinite(amt) && amt > 0) {
      total += amt;
      count++;
    }
  }
  cache = { ts: Date.now(), revenue: total, orders: count };
  return { revenue: total, orders: count };
}

export async function getKpis(): Promise<Kpis> {
  const { revenue, orders } = await readRevenueTab();

  const agents = store.list();
  const workflowsRunning = agents.filter(a => a.status === "working").length;
  const agentsActive = agents.filter(a => a.active).length;
  const agentsTotal = agents.length;

  // Health = % of agents whose most recent log isn't an error
  const erroredCount = agents.filter(a => a.logs[0]?.level === "err").length;
  const healthPct = agents.length === 0
    ? 100
    : Number((((agents.length - erroredCount) / agents.length) * 100).toFixed(1));
  const healthLabel: Kpis["systemHealthLabel"] =
    healthPct >= 95 ? "Excellent" : healthPct >= 85 ? "Good" : "Degraded";

  return {
    revenue,
    revenueDeltaPct: 0,         // TODO: 7-day delta when we add Revenue history reads
    orders,
    ordersDelta: 0,
    workflowsRunning,
    workflowsDelta: 0,
    agentsActive,
    agentsTotal,
    systemHealthPct: healthPct,
    systemHealthLabel: healthLabel,
    sourceTimestamp: new Date().toISOString(),
  };
}
