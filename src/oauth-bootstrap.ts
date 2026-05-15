import "dotenv/config";
import http from "http";
import { google } from "googleapis";

const PORT = 3000;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET in .env");
  console.error("Create or grab them at: https://console.cloud.google.com/apis/credentials");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("\n========================================");
console.log("UltronOS OAuth bootstrap");
console.log("========================================\n");
console.log("Step 1: Open this URL in your browser (sign in as info@neurospicymystic.com):\n");
console.log(authUrl);
console.log("\nStep 2: Approve the Google Sheets permission.");
console.log("Step 3: Browser will redirect to localhost — return here for the token.\n");

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth2callback")) {
    res.statusCode = 404;
    res.end();
    return;
  }
  const code = new URL(req.url, `http://localhost:${PORT}`).searchParams.get("code");
  if (!code) {
    res.end("Error: no code in callback URL");
    return;
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      console.error("\n❌ No refresh_token returned. Google only gives one on the FIRST consent.");
      console.error("Fix: revoke the existing grant at https://myaccount.google.com/permissions");
      console.error("Then re-run this script.");
      res.end("No refresh token — check terminal.");
      server.close();
      process.exit(1);
    }
    console.log("\n✅ SUCCESS\n");
    console.log("========================================");
    console.log("COPY THIS — paste into Render env as GOOGLE_OAUTH_REFRESH_TOKEN");
    console.log("========================================");
    console.log(tokens.refresh_token);
    console.log("========================================\n");
    res.end("✅ Done. Refresh token printed in your terminal. Close this tab.");
    server.close();
    setTimeout(() => process.exit(0), 500);
  } catch (err) {
    console.error("Token exchange failed:", err);
    res.end("Token exchange failed — check terminal.");
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT} for OAuth callback...\n`);
});
