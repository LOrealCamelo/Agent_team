import { ensureTabs, appendRow, getRows, TABS } from "./lib/sheets";

const SEED_PROJECTS: (string | number)[][] = [
  ["NSM-001", "Cheat Code PDF", "95%", "Content", "48hrs", "P0", 2910, "Add wax photos"],
  ["NSM-002", "Sticker Vault 500", "0%", "Product", "Week 2", "P0", 5400, "Batch 1 approval"],
  ["NSM-003", "Before They Burned Us", "10%", "Scribe", "Week 3", "P1", 5000, "Ch1 script"],
  ["NSM-004", "May Nervous System Kit", "0%", "Marketing", "Apr 25", "P1", 2700, "Mental Health Month"],
];

const SEED_TASKS: (string | number)[][] = [
  ["T-1001", "NSM-001", "Upload wax photos to Canva", "Todo", "Today", "YES", "L'Oreal", "2/5", "Unlocks $3K launch"],
  ["T-1002", "NSM-002", "Approve Sticker Batch 1", "Todo", "Today", "YES", "L'Oreal", "1/5", "Unlocks TikTok Shop"],
  ["T-1003", "NSM-001", "Write email for Cheat Code", "Todo", "Tomorrow", "NO", "Scribe", "3/5", "List grows 300"],
];

async function main() {
  console.log("Ensuring 5 tabs exist with headers...");
  await ensureTabs();
  console.log("Tabs ready.");

  const existingProjects = await getRows(TABS.projects);
  if (existingProjects.length === 0) {
    console.log("Seeding 4 active projects...");
    for (const row of SEED_PROJECTS) await appendRow(TABS.projects, row);
  } else {
    console.log(`Projects tab already has ${existingProjects.length} rows — skipping seed.`);
  }

  const existingTasks = await getRows(TABS.tasks);
  if (existingTasks.length === 0) {
    console.log("Seeding 3 sample tasks (2 are MIT_Today=YES)...");
    for (const row of SEED_TASKS) await appendRow(TABS.tasks, row);
  } else {
    console.log(`Tasks tab already has ${existingTasks.length} rows — skipping seed.`);
  }

  console.log("\n✅ Sheet initialized. Run `npm start` to launch the bot.");
}

main().catch((err) => {
  console.error("init-sheet failed:", err);
  process.exit(1);
});
