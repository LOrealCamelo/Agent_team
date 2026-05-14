import { google, sheets_v4 } from "googleapis";
import { config } from "../config";

const TABS = {
  projects: "Projects",
  tasks: "Tasks",
  revenue: "Revenue",
  agentLog: "Agent_Log",
  brainDump: "Brain_Dump",
} as const;

const HEADERS: Record<string, string[]> = {
  Projects: ["Project_ID", "Project_Name", "Status", "Owner_Agent", "Deadline", "Priority", "Revenue_Goal", "Notes"],
  Tasks: ["Task_ID", "Project_ID", "Task_Name", "Status", "Due_Date", "MIT_Today", "Agent", "Energy_Level", "Dopamine_Hit"],
  Revenue: ["Date", "Source", "Product", "Amount", "Agent", "Notes"],
  Agent_Log: ["Timestamp", "Agent", "Action", "Result", "XP_Gained"],
  Brain_Dump: ["Timestamp", "Dump", "PM_Response", "New_Tasks_Created"],
};

let sheetsClient: sheets_v4.Sheets | null = null;

function getClient(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;
  const creds = JSON.parse(config.googleServiceAccountJson);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

export async function getRows(tab: string): Promise<string[][]> {
  const res = await getClient().spreadsheets.values.get({
    spreadsheetId: config.googleSheetId,
    range: `${tab}!A2:Z`,
  });
  return (res.data.values as string[][]) || [];
}

export async function appendRow(tab: string, values: (string | number)[]): Promise<void> {
  await getClient().spreadsheets.values.append({
    spreadsheetId: config.googleSheetId,
    range: `${tab}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values.map(String)] },
  });
}

export async function updateCell(tab: string, cell: string, value: string): Promise<void> {
  await getClient().spreadsheets.values.update({
    spreadsheetId: config.googleSheetId,
    range: `${tab}!${cell}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
}

export async function ensureTabs(): Promise<void> {
  const sheets = getClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: config.googleSheetId });
  const existing = new Set((meta.data.sheets || []).map((s) => s.properties?.title));

  for (const [tab, headers] of Object.entries(HEADERS)) {
    if (!existing.has(tab)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.googleSheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
      });
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheetId,
      range: `${tab}!A1:${String.fromCharCode(64 + headers.length)}1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }
}

export { TABS };
