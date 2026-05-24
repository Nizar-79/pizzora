import { createClient } from "@/lib/supabase";

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
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu Editor</h2>
      {locations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No active locations. Add a location first.
        </div>
      ) : (
        <div className="space-y-6">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                <span className="text-sm text-gray-500">{loc.menus?.length ?? 0} items</span>
              </div>
              {!loc.menus || loc.menus.length === 0 ? (
                <div className="p-6 text-sm text-gray-400">No menu items yet.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                      <th className="px-6 py-3">Item</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Price</th>
                      <th className="px-6 py-3">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(loc.menus as { id: string; item_name: string; category: string; base_price: number; is_available: boolean }[]).map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.item_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">{item.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">${item.base_price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {item.is_available ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
