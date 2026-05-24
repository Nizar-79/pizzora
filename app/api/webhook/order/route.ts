import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { parseOrderFromTranscript } from "@/lib/claude";
import { sendToToast } from "@/lib/connectors/toast";
import { sendToSquare } from "@/lib/connectors/square";
import { sendToClover } from "@/lib/connectors/clover";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  let orderId: string | null = null;

  try {
    const body = await request.json();
    const {
      phone_number,
      caller_name,
      delivery_address,
      transcript,
      call_recording_url,
      call_duration,
    } = body;

    if (!phone_number || !transcript) {
      return NextResponse.json(
        { error: "phone_number and transcript are required" },
        { status: 400 }
      );
    }

    // 1. Look up pizzeria by phone number
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("*, menus(*)")
      .eq("phone_number", phone_number)
      .eq("is_active", true)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { error: "No active location found for this phone number" },
        { status: 404 }
      );
    }

    // 2. Log the call regardless of what happens next
    await supabase.from("call_logs").insert({
      location_id: location.id,
      caller_number: phone_number,
      duration: call_duration ?? null,
      call_recording_url: call_recording_url ?? null,
      transcript,
    });

    // 3. Parse the order transcript with Claude
    const parsed = await parseOrderFromTranscript(transcript, location.menus);

    // 4. Calculate totals with location's tax rate
    const subtotal = parsed.subtotal;
    const tax = parseFloat((subtotal * location.tax_rate).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    // 5. Save order to Supabase — this always happens
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        location_id: location.id,
        caller_name: caller_name ?? null,
        caller_number: phone_number,
        delivery_address: delivery_address ?? null,
        call_transcript: transcript,
        parsed_order_json: parsed,
        subtotal,
        tax,
        total,
        status: "received",
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error("Failed to save order to database");
    }

    orderId = order.id;

    // 6. Route to the correct POS system
    const standardOrder = {
      id: order.id,
      location_id: location.id,
      caller_name: caller_name ?? null,
      caller_number: phone_number,
      delivery_address: delivery_address ?? null,
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

    // 7. Mark order as sent to POS
    await supabase
      .from("orders")
      .update({ status: "sent_to_pos", pos_confirmation: posConfirmation })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      subtotal,
      tax,
      total,
      pos_confirmation: posConfirmation,
    });
  } catch (error) {
    // POS failed — flag the order so it's visible in the dashboard
    if (orderId) {
      await createClient()
        .from("orders")
        .update({ status: "pos_failed" })
        .eq("id", orderId);
    }

    console.error("[webhook/order]", error);
    return NextResponse.json(
      {
        error: "Order processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
