import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: ordersToday },
    { count: activeLocations },
    { count: posFailedCount },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("locations")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pos_failed")
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("orders")
      .select("id, caller_name, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    ordersToday: ordersToday ?? 0,
    activeLocations: activeLocations ?? 0,
    posFailedCount: posFailedCount ?? 0,
    recentOrders: recentOrders ?? [],
  };
}

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-700",
  sent_to_pos: "bg-green-100 text-green-700",
  pos_failed: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-yellow-100 text-yellow-700",
};

export default async function DashboardPage() {
  const { ordersToday, activeLocations, posFailedCount, recentOrders } =
    await getDashboardData();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Orders Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{ordersToday}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Active Locations</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeLocations}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">POS Failures Today</p>
          <p className={`text-3xl font-bold mt-1 ${posFailedCount > 0 ? "text-red-600" : "text-gray-900"}`}>
            {posFailedCount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No orders yet. Orders will appear here as they come in.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 text-sm text-gray-900">{order.caller_name ?? "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">${order.total?.toFixed(2) ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
