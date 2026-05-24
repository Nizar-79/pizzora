import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase";
import { parseOrderFromTranscript } from "@/lib/claude";
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

async function processOrder(
  location: Location,
  payload: ThinkrrPayload,
  callLogId: string
) {
  const supabase = createClient();
  let orderId: string | null = null;

  try {
    const parsed = await parseOrderFromTranscript(payload.transcript!, location.menus);

    const subtotal = parsed.subtotal;
    const tax = parseFloat((subtotal * location.tax_rate).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const { data: order } = await supabase
      .from("orders")
      .insert({
        location_id: location.id,
        caller_number: payload.caller_number,
        call_transcript: payload.transcript,
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

    const standardOrder = {
      id: order.id,
      location_id: location.id,
      caller_name: null,
      caller_number: payload.caller_number,
      delivery_address: null,
      items: parsed.items,
      subtotal,
      tax,
      total,
      special_instructions: parsed.special_instructions ?? "",
    };

    let posConfirmation: string;
    switch (location.pos_type) {
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
      .eq("id", order.id);

    // Link the order back to the call log
    await supabase
      .from("call_logs")
      .update({ order_id: order.id })
      .eq("id", callLogId);
  } catch (error) {
    if (orderId) {
      await createClient()
        .from("orders")
        .update({ status: "pos_failed" })
        .eq("id", orderId);
    }
    console.error("[processOrder]", error);
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  let payload: ThinkrrPayload;
  try {
    payload = await request.json();
  } catch {
    // Malformed body — still return 200 so Thinkrr doesn't retry
    return NextResponse.json({ received: true });
  }

  const { transcript, call_status, caller_number, call_recording_url, to_number } = payload;

  // Look up the pizzeria by the number Thinkrr called (to_number)
  const { data: location } = await supabase
    .from("locations")
    .select("*, menus(*)")
    .eq("phone_number", to_number)
    .eq("is_active", true)
    .maybeSingle();

  // Log every call — completed, missed, or voicemail
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

  // Only parse orders from completed calls with a known location and transcript
  if (call_status === "Completed" && location && callLog?.id && transcript) {
    after(() => processOrder(location as Location, payload, callLog.id));
  }

  // Always respond immediately — Thinkrr expects 200 within 3 seconds
  return NextResponse.json({ received: true });
}
