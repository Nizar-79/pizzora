import { createClient } from "@/lib/supabase";
import AddMenuItemForm from "@/components/AddMenuItemForm";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 60;

async function getLocationsWithMenus() {
  const supabase = createClient();
  const { data } = await supabase
    .from("locations")
    .select("id, name, menus(*)")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export default async function MenuEditorPage() {
  const locations = await getLocationsWithMenus();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Menu Editor</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage menu items for each location</p>
      </div>

      {locations.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground text-center py-12">
            No active locations. Add a location first.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                <CardTitle className="text-base font-semibold">{loc.name}</CardTitle>
                <span className="text-sm text-muted-foreground">{loc.menus?.length ?? 0} items</span>
              </CardHeader>
              <AddMenuItemForm
                locationId={loc.id}
                items={(loc.menus ?? []) as { id: string; item_name: string; category: string; base_price: number; is_available: boolean }[]}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
