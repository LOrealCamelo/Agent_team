import Anthropic from "@anthropic-ai/sdk";
import { config, models } from "../config";
import { ensureAnchor, escapeIfAIDisclaimer } from "./brand";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

type ModelTier = "master" | "highVolume" | "routing";

async function call(
  tier: ModelTier,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): Promise<string> {
  const response = await client.messages.create({
    model: models[tier],
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

export const callOpus = (sys: string, msg: string, max = 1024) =>
  call("master", sys, msg, max);

export const callSonnet = (sys: string, msg: string, max = 1024) =>
  call("highVolume", sys, msg, max);

export const callHaiku = (sys: string, msg: string, max = 512) =>
  call("routing", sys, msg, max);
