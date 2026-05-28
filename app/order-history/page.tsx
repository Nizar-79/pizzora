import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const revalidate = 30;

async function getOrders() {
  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, locations(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

type OrderStatus = "received" | "sent_to_pos" | "pos_failed" | "completed" | "cancelled";

const orderStatusVariant: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  received: "secondary",
  sent_to_pos: "default",
  pos_failed: "destructive",
  completed: "outline",
  cancelled: "outline",
};

export default async function OrderHistoryPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Order History</h2>
        <p className="text-muted-foreground text-sm mt-1">All orders processed by voice AI</p>
      </div>

      <Card>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No orders yet. Orders appear here after voice calls are processed.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transcript</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {(order.locations as { name: string } | null)?.name ?? "—"}
                  </TableCell>
                  <TableCell>{order.caller_name ?? "Unknown"}</TableCell>
                  <TableCell className="font-medium">
                    ${order.total?.toFixed(2) ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={orderStatusVariant[order.status as OrderStatus] ?? "outline"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {order.call_transcript ?? "—"}
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
