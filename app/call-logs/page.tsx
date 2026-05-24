import { createClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getCallLogs() {
  const supabase = createClient();
  const { data } = await supabase
    .from("call_logs")
    .select("*, locations(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function CallLogsPage() {
  const logs = await getCallLogs();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Call Logs</h2>
      <div className="bg-white rounded-xl border border-gray-200">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No calls yet. Call logs appear here after voice calls are received.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Caller</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Recording</th>
                <th className="px-6 py-3">Transcript</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{(log.locations as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.caller_number ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDuration(log.duration)}</td>
                  <td className="px-6 py-4 text-sm">
                    {log.call_recording_url ? (
                      <a href={log.call_recording_url} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Listen</a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.transcript ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
