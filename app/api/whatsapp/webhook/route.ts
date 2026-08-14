import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = "sellora_webhook_2026";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log("WhatsApp Webhook:", body);

  return NextResponse.json(
    { status: "EVENT_RECEIVED" },
    { status: 200 }
  );
}