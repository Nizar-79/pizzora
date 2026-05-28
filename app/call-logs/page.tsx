import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const revalidate = 30;

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Call Logs</h2>
        <p className="text-muted-foreground text-sm mt-1">All incoming calls received by Pizzora</p>
      </div>

      <Card>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No calls yet. Call logs appear here after voice calls are received.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Caller</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Recording</TableHead>
                <TableHead>Transcript</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {(log.locations as { name: string } | null)?.name ?? "—"}
                  </TableCell>
                  <TableCell>{log.caller_number ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDuration(log.duration)}
                  </TableCell>
                  <TableCell>
                    {log.call_recording_url ? (
                      <a
                        href={log.call_recording_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        Listen
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {log.transcript ?? "—"}
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
