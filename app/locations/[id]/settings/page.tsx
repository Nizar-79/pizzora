import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import PosSettingsForm from "./PosSettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LocationSettingsPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();

  const { data: location } = await supabase
    .from("locations")
    .select("id, name, pos_type, pos_api_key")
    .eq("id", id)
    .single();

  if (!location) notFound();

  const hasApiKey = !!location.pos_api_key;
  const maskedKey = hasApiKey
    ? `••••••••${location.pos_api_key!.slice(-4)}`
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/locations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Locations
      </Link>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{location.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">Location Settings</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">POS Integration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your point-of-sale system so orders are sent automatically.
          </p>
        </CardHeader>
        <CardContent>
          <PosSettingsForm
            locationId={location.id}
            currentPosType={location.pos_type}
            hasApiKey={hasApiKey}
            maskedKey={maskedKey}
          />
        </CardContent>
      </Card>
    </div>
  );
}
