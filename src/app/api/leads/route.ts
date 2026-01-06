import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper to create a Supabase client with the user's access token
const createServerClient = (request: Request) => {
  const authHeader = request.headers.get("Authorization");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: authHeader || "",
        },
      },
    }
  );
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  const startTime = Date.now();
  try {
    const supabase = createServerClient(request);
    const { data, error, count } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[API /leads GET] Supabase error:", error);
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    const duration = Date.now() - startTime;
    console.log(`[API /leads GET] Success: fetched ${data?.length || 0}/${count || 0} leads in ${duration}ms (limit: ${limit}, offset: ${offset})`);

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("[API /leads GET] Unexpected error:", error);
    return NextResponse.json({ detail: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient(request);
  try {
    const rawBody = await request.json();

    // Get current user to set created_by
    const { data: { user }, error: userError } = await (supabase.auth as any).getUser();

    if (userError || !user) {
      console.error("[API /leads POST] Unauthorized access attempt");
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and map body to DB schema
    const body: any = {
      name: rawBody.name,
      phone_number: rawBody.phone_number,
      service: rawBody.service,
      description: rawBody.description,
      date: rawBody.meeting_date || rawBody.date,
      follow_up_date: rawBody.follow_up_date,
      is_converted: rawBody.is_converted || false,
      agent_ids: rawBody.agent_ids || [],
      status: rawBody.status || 'New',
      created_by: user.id
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("[API /leads POST] Supabase insert error:", error);
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    // Log the creation activity in lead_updates
    const logEntry = {
      lead_id: data.id,
      content: `New Lead "${data.name}" created by "${user?.user_metadata?.name || user?.email || 'User'}"`,
      type: 'Activity',
      created_by: user.id
    };

    await supabase.from("lead_updates").insert(logEntry);

    console.log(`[API /leads POST] Success: created lead "${data.name}" (ID: ${data.id})`);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[API /leads POST] Unexpected error:", error);
    return NextResponse.json({ detail: "Failed to create lead" }, { status: 500 });
  }
}
