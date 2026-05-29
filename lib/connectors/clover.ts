import type { StandardOrder } from "./toast";

// pos_api_key for Clover must be stored as "merchantId|apiKey"
export async function sendToClover(
  order: StandardOrder,
  combinedKey: string
): Promise<string> {
  const [merchantId, apiKey] = combinedKey.split("|");
  if (!merchantId || !apiKey) {
    throw new Error("Clover key must be in the format: merchantId|apiKey");
  }

  const isProd = process.env.POS_ENV === "production";
  const baseUrl = isProd
    ? "https://api.clover.com"
    : "https://sandbox.dev.clover.com";

  const response = await fetch(
    `${baseUrl}/v3/merchants/${merchantId}/orders`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        externalReferenceId: order.id.replace(/-/g, "").slice(0, 12),
        note: order.special_instructions || undefined,
        lineItems: {
          elements: order.items.map((item) => ({
            name: item.name,
            price: Math.round(item.unit_price * 100),
            unitQty: item.quantity * 1000,
          })),
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    console.error(`[Clover] ${response.status}:`, body);
    throw new Error(`Clover API error: ${response.status} ${body}`);
  }

  const data = await response.json();
  return data.id ?? order.id;
}
