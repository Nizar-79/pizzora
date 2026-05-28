import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, MapPin, AlertTriangle } from "lucide-react";

export const revalidate = 15;

async function getDashboardData() {
  const supabase = createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: ordersToday },
    { count: activeLocations },
    { count: posFailedCount },
    { data: recentOrders },
    { data: recentCalls },
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
    supabase
      .from("call_logs")
      .select("id, caller_number, call_status, created_at, locations(name), orders(status, total)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    ordersToday: ordersToday ?? 0,
    activeLocations: activeLocations ?? 0,
    posFailedCount: posFailedCount ?? 0,
    recentOrders: recentOrders ?? [],
    recentCalls: recentCalls ?? [],
  };
}

type OrderStatus = "received" | "sent_to_pos" | "pos_failed" | "completed" | "cancelled";
type CallStatus = "Completed" | "No Answer" | "Voicemail";

const orderStatusVariant: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  received: "secondary",
  sent_to_pos: "default",
  pos_failed: "destructive",
  completed: "outline",
  cancelled: "outline",
};

const callStatusVariant: Record<CallStatus, "default" | "secondary" | "destructive" | "outline"> = {
  Completed: "default",
  "No Answer": "secondary",
  Voicemail: "outline",
};

export default async function DashboardPage() {
  const { ordersToday, activeLocations, posFailedCount, recentOrders, recentCalls } =
    await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">Today&apos;s overview across all locations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ordersToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeLocations}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">POS Failures Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${posFailedCount > 0 ? "text-destructive" : ""}`}>
              {posFailedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Call Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          <CardTitle className="text-base font-semibold">Live Call Feed</CardTitle>
          <span className="text-xs text-muted-foreground ml-auto">Last 10 calls</span>
        </CardHeader>
        {recentCalls.length === 0 ? (
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-6">
              No calls yet. Calls will appear here as Thinkrr sends them.
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Caller</TableHead>
                <TableHead>Call Status</TableHead>
                <TableHead>Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCalls.map((call) => {
                const order = call.orders as unknown as { status: string; total: number } | null;
                const location = call.locations as unknown as { name: string } | null;
                return (
                  <TableRow key={call.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(call.created_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{location?.name ?? <span className="text-muted-foreground">Unknown</span>}</TableCell>
                    <TableCell>{call.caller_number ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={callStatusVariant[call.call_status as CallStatus] ?? "outline"}>
                        {call.call_status ?? "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order ? (
                        <Badge variant={orderStatusVariant[order.status as OrderStatus] ?? "outline"}>
                          {order.status} · ${order.total?.toFixed(2)}
                        </Badge>
                      ) : call.call_status === "Completed" ? (
                        <span className="text-xs text-orange-500">Processing…</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
        </CardHeader>
        {recentOrders.length === 0 ? (
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-6">
              No orders yet. Orders will appear here as they come in.
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.caller_name ?? "Unknown"}</TableCell>
                  <TableCell>${order.total?.toFixed(2) ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={orderStatusVariant[order.status as OrderStatus] ?? "outline"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
