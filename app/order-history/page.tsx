import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getOrders() {
  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, locations(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-700",
  sent_to_pos: "bg-green-100 text-green-700",
  pos_failed: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-yellow-100 text-yellow-700",
};

export default async function OrderHistoryPage() {
  const orders = await getOrders();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
      <div className="bg-white rounded-xl border border-gray-200">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No orders yet. Orders appear here after voice calls are processed.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Transcript</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{(order.locations as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{order.caller_name ?? "Unknown"}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${order.total?.toFixed(2) ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{order.call_transcript ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
