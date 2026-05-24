import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Locations</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {locations.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No locations yet. Use the API to add your first pizzeria location.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">POS System</th>
                <th className="px-6 py-3">Tax Rate</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{loc.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{loc.phone_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{loc.pos_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{(loc.tax_rate * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${loc.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {loc.is_active ? "Active" : "Inactive"}
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
