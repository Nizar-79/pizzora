import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase-server-auth";
import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-700",
  sent_to_pos: "bg-green-100 text-green-700",
  pos_failed: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-yellow-100 text-yellow-700",
};

export default async function PortalPage() {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: location } = await supabase
    .from("locations")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!location) {
    return (
      <div className="text-center py-20 text-gray-500">
        No location is linked to your account yet. Contact support to get set up.
      </div>
    );
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: ordersToday },
    { count: totalOrders },
    { data: recentOrders },
    { data: recentCalls },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("location_id", location.id)
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("location_id", location.id),
    supabase
      .from("orders")
      .select("id, caller_name, total, status, created_at")
      .eq("location_id", location.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("call_logs")
      .select("id, caller_number, call_status, created_at")
      .eq("location_id", location.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Dashboard</h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Orders Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{ordersToday ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalOrders ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
        </div>
        {!recentOrders?.length ? (
          <div className="p-6 text-center text-gray-400">No orders yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{order.caller_name ?? "Unknown"}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${order.total?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Calls</h3>
        </div>
        {!recentCalls?.length ? (
          <div className="p-6 text-center text-gray-400">No calls yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Caller</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((call) => (
                <tr key={call.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(call.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{call.caller_number ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      call.call_status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {call.call_status}
                    </span>
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
