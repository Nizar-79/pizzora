export interface StandardOrder {
  id: string;
  location_id: string;
  caller_name: string | null;
  caller_number: string | null;
  delivery_address: string | null;
  items: Array<{
    name: string;
    quantity: number;
    modifiers: string[];
    unit_price: number;
    line_total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  special_instructions: string;
}

export async function sendToToast(
  order: StandardOrder,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    "https://ws-sandbox.toasttab.com/orders/v2/orders",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entityType: "Order",
        externalId: order.id,
        deliveryInfo: order.delivery_address
          ? { address1: order.delivery_address }
          : undefined,
        checks: [
          {
            selections: order.items.map((item) => ({
              itemGroup: { name: item.name },
              quantity: item.quantity,
              modifiers: item.modifiers.map((m) => ({ name: m })),
            })),
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Toast API error: ${response.status} ${await response.text()}`
    );
  }

  const data = await response.json();
  return data.guid ?? order.id;
}
