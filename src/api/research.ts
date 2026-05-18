/**
 * Research Agent — real AI integration (Phase 3).
 *
 * Generates 10 Etsy digital product ideas via Claude (Anthropic SDK).
 * Updates the in-memory store with status transitions and logs.
 *
 * API key + model come from env vars (ANTHROPIC_API_KEY, ANTHROPIC_MODEL).
 * No keys are hardcoded.
 */

import Anthropic from "@anthropic-ai/sdk";
import { store } from "./state.js";

export interface ProductIdea {
  title: string;
  description: string;
  target_audience: string;
  estimated_price_range: string;
}

const RESEARCH_AGENT_ID = "research";

const SYSTEM_PROMPT = `You are the Research Agent for an autonomous Etsy storefront.
Your specialty: generating digital product ideas (printables, planners, journals,
oracle/tarot decks, affirmation cards, wellness templates, witchy/mystical assets).
Output ONLY a valid JSON array of exactly 10 objects. No prose. No markdown fences.
Each object MUST have these exact fields:
  - title (string, punchy and Etsy-search-friendly, < 80 chars)
  - description (string, 1–2 sentences explaining the product)
  - target_audience (string, who buys this and why)
  - estimated_price_range (string, e.g. "$8–$18")`;

const USER_PROMPT = `Generate 10 fresh digital product ideas for a NeuroSpicy/mystical/wellness Etsy shop.
Mix formats (printables, journals, planners, oracle decks, sticker packs).
Skip generic ideas — lean witchy, ADHD/autistic-friendly, slightly cyberpunk.`;

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY not set. Add it to .env (see .env.example).");
  }
  return new Anthropic({ apiKey: key });
}

/**
 * Extract the first JSON array found in a string. Tolerates models that
 * occasionally wrap output in ```json``` fences or add a stray prose line.
 */
function extractJsonArray(text: string): unknown[] {
  // Strip code fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  // Direct parse
  try {
    const v = JSON.parse(cleaned);
    if (Array.isArray(v)) return v;
  } catch {
    // fall through to regex fallback
  }
  // Find first [...] block
  const m = cleaned.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("Model output contained no JSON array");
  return JSON.parse(m[0]);
}

function validateIdeas(arr: unknown[]): ProductIdea[] {
  if (!Array.isArray(arr)) throw new Error("Result is not an array");
  if (arr.length === 0) throw new Error("Result array is empty");
  return arr.map((raw, i) => {
    if (!raw || typeof raw !== "object") {
      throw new Error(`Idea #${i + 1} is not an object`);
    }
    const o = raw as Record<string, unknown>;
    const need = (k: string) => {
      if (typeof o[k] !== "string" || !(o[k] as string).trim()) {
        throw new Error(`Idea #${i + 1} missing field "${k}"`);
      }
      return (o[k] as string).trim();
    };
    return {
      title: need("title"),
      description: need("description"),
      target_audience: need("target_audience"),
      estimated_price_range: need("estimated_price_range"),
    };
  });
}

/**
 * Run the Research Agent end-to-end.
 * Updates store.research status across thinking → working → complete (or error).
 * Returns the parsed ideas on success.
 */
export async function runResearchAgent(): Promise<ProductIdea[]> {
  const agent = store.get(RESEARCH_AGENT_ID);
  if (!agent) throw new Error("Research agent not found in store");

  // 1. Status: thinking
  store.setStatus(RESEARCH_AGENT_ID, "thinking", "Generating Etsy product ideas");
  store.setProgress(RESEARCH_AGENT_ID, 10);
  store.log(RESEARCH_AGENT_ID, "Calling Claude to generate 10 Etsy product ideas", "info");

  try {
    const client = getClient();
    const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

    // 2. Status: working
    store.setStatus(RESEARCH_AGENT_ID, "working");
    store.setProgress(RESEARCH_AGENT_ID, 40);
    store.log(RESEARCH_AGENT_ID, `Querying model: ${model}`, "info");

    const response = await client.messages.create({
      model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: USER_PROMPT }],
    });

    store.setProgress(RESEARCH_AGENT_ID, 75);

    // 3. Extract text from response
    const textBlocks = response.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text);
    if (textBlocks.length === 0) {
      throw new Error("Model returned no text content");
    }
    const raw = textBlocks.join("\n");

    // 4. Parse + validate
    const parsedArr = extractJsonArray(raw);
    const ideas = validateIdeas(parsedArr);

    // 5. Store result + mark complete
    store.setResult(RESEARCH_AGENT_ID, ideas);
    store.setProgress(RESEARCH_AGENT_ID, 100);
    store.setStatus(RESEARCH_AGENT_ID, "complete", `Generated ${ideas.length} ideas`);
    store.log(
      RESEARCH_AGENT_ID,
      `Successfully generated ${ideas.length} product ideas`,
      "ok",
    );
    agent.active = false; // research is one-shot, not a loop
    return ideas;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    store.setStatus(RESEARCH_AGENT_ID, "error", "AI call failed");
    store.log(RESEARCH_AGENT_ID, `Error: ${msg}`, "err");
    store.setResult(RESEARCH_AGENT_ID, { error: msg });
    throw err;
  }
}
