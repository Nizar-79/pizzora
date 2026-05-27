import type { StandardOrder } from "./toast";

export async function sendToSquare(
  order: StandardOrder,
  accessToken: string
): Promise<string> {
  const isProd = process.env.POS_ENV === "production";
  const baseUrl = isProd
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

  const response = await fetch(
    `${baseUrl}/v2/orders`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: order.id,
        order: {
          reference_id: order.id,
          line_items: order.items.map((item) => ({
            name: item.name,
            quantity: String(item.quantity),
            base_price_money: {
              amount: Math.round(item.unit_price * 100),
              currency: "USD",
            },
            modifiers: item.modifiers.map((m) => ({ name: m })),
          })),
          fulfillments: order.delivery_address
            ? [
                {
                  type: "DELIVERY",
                  delivery_details: {
                    recipient: {
                      display_name: order.caller_name ?? "Customer",
                      phone_number: order.caller_number ?? "",
                      address: { address_line_1: order.delivery_address },
                    },
                  },
                },
              ]
            : [],
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Square API error: ${response.status} ${await response.text()}`
    );
  }

  const data = await response.json();
  return data.order?.id ?? order.id;
}
