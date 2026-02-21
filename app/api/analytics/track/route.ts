import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackEventPayloadSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // 2. Parse & validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidJson" }, { status: 400 });
  }

  const parsed = trackEventPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // 3. Insert event (unique constraint handles fire-once deduplication)
  const { error } = await supabase.from("analytics_events").insert({
    user_id: user.id,
    event_name: parsed.data.event_name,
    metadata: parsed.data.metadata ?? {},
  });

  // 23505 = unique_violation — event already recorded, still a success
  if (error && error.code !== "23505") {
    console.error("[analytics/track] Insert error:", error);
    return NextResponse.json({ error: "insertFailed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
