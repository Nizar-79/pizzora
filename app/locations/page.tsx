import { createClient } from "@/lib/supabase";
import Link from "next/link";
import AddLocationForm from "@/components/AddLocationForm";
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

export const revalidate = 60;

async function getLocations() {
  const supabase = createClient();
  const { data } = await supabase
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Locations</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage your pizzeria locations</p>
        </div>
        <AddLocationForm />
      </div>

      <Card>
        {locations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No locations yet. Add your first pizzeria location above.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>POS System</TableHead>
                <TableHead>Tax Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell className="text-muted-foreground">{loc.phone_number}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {loc.pos_type === "none" ? "Dashboard Only" : loc.pos_type}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(loc.tax_rate * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant={loc.is_active ? "default" : "outline"}>
                      {loc.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/locations/${loc.id}/settings`}
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      Settings
                    </Link>
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
