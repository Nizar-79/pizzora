import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { parseOrderFromTranscript, ParsedOrderItem } from "@/lib/claude";
import { sendToToast } from "@/lib/connectors/toast";
import { sendToSquare } from "@/lib/connectors/square";
import { sendToClover } from "@/lib/connectors/clover";

interface ThinkrrPayload {
  transcript?: string;
  call_status: string;
  caller_number: string;
  call_recording_url?: string;
  timestamp?: string;
  to_number: string;
}

interface Location {
  id: string;
  pos_type: string;
  pos_api_key: string;
  tax_rate: number;
  menus: Array<{
    item_name: string;
    base_price: number;
    category: string;
    available_modifiers: string[];
  }>;
}

// Fire-and-forget POS routing — order is already saved before this runs
async function routeToPOS(
  location: Location,
  orderId: string,
  standardOrder: {
    id: string;
    location_id: string;
    caller_name: null;
    caller_number: string;
    delivery_address: null;
    items: ParsedOrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    special_instructions: string;
  }
) {
  const supabase = createClient();
  try {
    let posConfirmation: string;
    switch (location.pos_type) {
      case "none":
        return; // Dashboard-only mode — order stays as "received" for staff to view
      case "toast":
        posConfirmation = await sendToToast(standardOrder, location.pos_api_key);
        break;
      case "square":
        posConfirmation = await sendToSquare(standardOrder, location.pos_api_key);
        break;
      case "clover":
        posConfirmation = await sendToClover(standardOrder, location.pos_api_key);
        break;
      default:
        throw new Error(`Unknown POS type: ${location.pos_type}`);
    }
    await supabase
      .from("orders")
      .update({ status: "sent_to_pos", pos_confirmation: posConfirmation })
      .eq("id", orderId);
  } catch (error) {
    await supabase.from("orders").update({ status: "pos_failed" }).eq("id", orderId);
    console.error("[routeToPOS]", error);
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const incoming = request.headers.get("x-thinkrr-secret");
    if (incoming !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const supabase = createClient();

  let payload: ThinkrrPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  const { transcript, call_status, caller_number, call_recording_url, to_number } = payload;

  const { data: location } = await supabase
    .from("locations")
    .select("*, menus(*)")
    .eq("phone_number", to_number)
    .eq("is_active", true)
    .maybeSingle();

  const { data: callLog } = await supabase
    .from("call_logs")
    .insert({
      location_id: location?.id ?? null,
      caller_number: caller_number ?? null,
      call_status: call_status ?? null,
      call_recording_url: call_recording_url ?? null,
      transcript: transcript ?? null,
      raw_payload: payload,
    })
    .select()
    .single();

  // Parse and save the order synchronously — POS routing fires after
  if (call_status === "Completed" && location && callLog?.id && transcript) {
    let orderId: string | null = null;
    try {
      const loc = location as Location;
      const parsed = await parseOrderFromTranscript(transcript, loc.menus);

      const subtotal = parsed.subtotal;
      const tax = parseFloat((subtotal * loc.tax_rate).toFixed(2));
      const total = parseFloat((subtotal + tax).toFixed(2));

      const { data: order } = await supabase
        .from("orders")
        .insert({
          location_id: loc.id,
          caller_number: caller_number ?? null,
          call_transcript: transcript,
          parsed_order_json: parsed,
          subtotal,
          tax,
          total,
          status: "received",
        })
        .select()
        .single();

      if (!order) throw new Error("Failed to save order to database");
      orderId = order.id;

      // Link order back to the call log
      await supabase.from("call_logs").update({ order_id: order.id }).eq("id", callLog.id);

      const standardOrder = {
        id: order.id,
        location_id: loc.id,
        caller_name: null as null,
        caller_number: caller_number ?? "",
        delivery_address: null as null,
        items: parsed.items,
        subtotal,
        tax,
        total,
        special_instructions: parsed.special_instructions ?? "",
      };

      // POS routing is non-critical — fire without awaiting so we return 200 faster
      void routeToPOS(loc, order.id, standardOrder);
    } catch (error) {
      if (orderId) {
        await supabase.from("orders").update({ status: "pos_failed" }).eq("id", orderId);
      }
      console.error("[webhook processOrder]", error);
    }
  }

  // Respond to Thinkrr
  return NextResponse.json({ received: true });
}
