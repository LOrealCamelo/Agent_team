import Anthropic from "@anthropic-ai/sdk";
import { config, models } from "../config";
import { ensureAnchor, escapeIfAIDisclaimer } from "./brand";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function callOpus(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024,
): Promise<string> {
  const response = await client.messages.create({
    model: models.master,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  return ensureAnchor(escapeIfAIDisclaimer(text));
}
