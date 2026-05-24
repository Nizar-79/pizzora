import type { StandardOrder } from "./toast";

export async function sendToClover(
  order: StandardOrder,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    "https://sandbox.dev.clover.com/v3/merchants/ORDER/orders",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        externalReferenceId: order.id,
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
    throw new Error(
      `Clover API error: ${response.status} ${await response.text()}`
    );
  }

  const data = await response.json();
  return data.id ?? order.id;
}
