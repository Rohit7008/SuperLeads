/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const supabase = createServerClient(request);
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");
  const targetUserId = searchParams.get("userId");
  const fetchAll = searchParams.get("all") === "true";

  const startTime = Date.now();
  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await (supabase.auth as any).getUser();
    if (userError || !user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    // 2. Determine whose leads to fetch
    // If 'all=true' is requested, we skip the created_by filter.
    // TODO: Enforce admin check if "All Leads" should be strictly restricted.
    // Current requirement: "he can see all leads" - implying visibility for user context.
    // We will default to skipping filter if fetchAll is true.

    let userIdToFetch = user.id;
    let useServiceRole = false;
    let shouldFilterByUser = true;

    if (fetchAll) {
      shouldFilterByUser = false;
      // Ideally we should verify if user is allowed to see all. 
      // For now, proceeding as requested.
    } else if (targetUserId && targetUserId !== user.id) {
      // ... existing admin check logic ...
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === 'admin') {
        userIdToFetch = targetUserId;
        useServiceRole = true;
        shouldFilterByUser = true;
      } else {
        return NextResponse.json({ detail: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    // 3. Create client
    let queryClient = supabase;
    if (useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      queryClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }

    // Join lead_services with leads
    let query = queryClient
      .from("lead_services")
      .select(`
                *,
                leads (
                    id,
                    name,
                    phone_number
                )
            `);

    // Apply User Filter only if needed
    if (shouldFilterByUser) {
      query = query.eq("created_by", userIdToFetch);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[API /leads GET] Supabase error:", error);
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    // Flatten data for UI Consumption
    const flattenedData = data.map((service: any) => ({
      service_id: service.id,
      lead_id: service.leads?.id,
      client_name: service.leads?.name || "Unknown",
      phone_number: service.leads?.phone_number || "N/A",
      service_name: service.service_name,
      coverage: service.coverage,
      premium_investment: service.premium_investment,
      status: service.status,
      discussion_date: service.discussion_date,
      follow_up_date: service.follow_up_date,
      date: service.created_at,
      created_by: service.created_by,
    }));

    const duration = Date.now() - startTime;
    console.log(`[API /leads GET] Success: fetched ${data?.length || 0} services in ${duration}ms`);

    return NextResponse.json(flattenedData || []);
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

    // 1. Check if Lead (Client) already exists by phone number
    let leadId = null;
    let clientName = rawBody.name;

    // Clean phone number for check
    const phoneCheck = rawBody.phone_number.trim();

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, name")
      .eq("phone_number", phoneCheck)
      .single();

    if (existingLead) {
      // Use existing client
      leadId = existingLead.id;
      clientName = existingLead.name;
      console.log(`[API /leads POST] Found existing client "${clientName}" (ID: ${leadId})`);
    } else {
      // Create New Client Profile
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          name: rawBody.name,
          phone_number: rawBody.phone_number,
          description: rawBody.description, // Initial description goes to profile
          created_by: user.id,
          service_deprecated: rawBody.service_name || rawBody.service || 'Unknown' // Satisfy legacy NOT NULL constraint
        })
        .select()
        .single();

      if (leadError) {
        throw new Error(`Failed to create client profile: ${leadError.message}`);
      }
      leadId = newLead.id;
    }

    // 2. Parse Services (Split comma-separated values)
    const rawServices = rawBody.service_name || rawBody.service;
    const serviceList = rawServices.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

    // Default if empty
    if (serviceList.length === 0) {
      serviceList.push('General Inquiry');
    }

    const createdServices = [];

    // 3. Iterate and Create Lead Service Entries
    for (const serviceName of serviceList) {
      const serviceBody = {
        lead_id: leadId,
        service_name: serviceName,
        coverage: rawBody.coverage,
        premium_investment: rawBody.premium_investment,
        status: rawBody.status || 'New',
        discussion_date: rawBody.discussion_date || rawBody.date,
        follow_up_date: rawBody.follow_up_date,
        created_by: user.id
      };

      const { data: serviceData, error: serviceError } = await supabase
        .from("lead_services")
        .insert(serviceBody)
        .select()
        .single();

      if (serviceError) {
        console.error(`[API /leads POST] Failed to create service "${serviceName}": ${serviceError.message}`);
        // Continue to next service instead of failing all? 
        // Or throw? Let's throw to be safe, but catching it might be better. 
        // For now, let's allow partial failure logging but continue.
        continue;
      }

      createdServices.push(serviceData);

      // Log the creation activity
      const userName = user?.user_metadata?.full_name || user?.email || 'User';
      const logEntry = {
        lead_id: leadId,
        content: `New Service Opportunity "${serviceName}" added for client`,
        type: 'Activity',
        created_by: user.id,
        created_by_name: userName // Explicitly save the name
      };

      await supabase.from("lead_updates").insert(logEntry);
      console.log(`[API /leads POST] Created service "${serviceName}" (ID: ${serviceData.id})`);
    }

    console.log(`[API /leads POST] Success: created ${createdServices.length} services for client (ID: ${leadId})`);

    // Return the first one just to satisfy REST conventions (or an array, but simple is better for now)
    return NextResponse.json(createdServices[0] || {}, { status: 201 });

  } catch (error: any) {
    console.error("[API /leads POST] Unexpected error:", error);
    return NextResponse.json({ detail: error.message || "Failed to create lead" }, { status: 500 });
  }
}
