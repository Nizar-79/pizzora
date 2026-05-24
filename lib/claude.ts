import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface MenuItem {
  item_name: string;
  base_price: number;
  category: string;
  available_modifiers: string[];
}

export interface ParsedOrderItem {
  name: string;
  quantity: number;
  modifiers: string[];
  unit_price: number;
  line_total: number;
}

export interface ParsedOrder {
  items: ParsedOrderItem[];
  subtotal: number;
  special_instructions: string;
  confidence_score: number;
}

export async function parseOrderFromTranscript(
  transcript: string,
  menu: MenuItem[]
): Promise<ParsedOrder> {
  const menuText = menu
    .map(
      (item) =>
        `- ${item.item_name} (${item.category}): $${item.base_price}${
          item.available_modifiers?.length
            ? ` | Modifiers: ${item.available_modifiers.join(", ")}`
            : ""
        }`
    )
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an order parsing system for a pizzeria. Parse the following call transcript into a structured order based on the menu provided.

MENU:
${menuText}

TRANSCRIPT:
${transcript}

Return ONLY a valid JSON object with this exact structure — no extra text, no markdown:
{
  "items": [
    {
      "name": "exact item name from menu",
      "quantity": 1,
      "modifiers": ["modifier1"],
      "unit_price": 0.00,
      "line_total": 0.00
    }
  ],
  "subtotal": 0.00,
  "special_instructions": "any delivery or preparation notes",
  "confidence_score": 0.95
}

Rules:
- Only include items that appear on the menu
- Match item names exactly as they appear in the menu
- Calculate line_total as unit_price times quantity
- Calculate subtotal as sum of all line_totals
- Set confidence_score between 0 and 1 (lower if transcript is unclear)
- If no items are found, return empty items array with subtotal 0`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected Claude response type");

  return JSON.parse(content.text) as ParsedOrder;
}
