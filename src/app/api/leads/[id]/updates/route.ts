/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createServerClient(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    try {

        // 1. Fetch updates for this lead
        let query = supabase
            .from("lead_updates")
            .select("*")
            .eq("lead_id", id)
            .order("created_at", { ascending: false });

        // If filtering by service, add constraint
        if (serviceId) {
            query = query.eq("service_id", serviceId);
        }

        const { data: updates, error: updatesError } = await query;

        if (updatesError) {
            if (updatesError.code === 'PGRST116' || updatesError.message.includes('relation "lead_updates" does not exist')) {
                return NextResponse.json([]);
            }
            console.error(`[API /leads/[id]/updates GET] Supabase error (ID: ${id}):`, updatesError);
            return NextResponse.json({ detail: updatesError.message }, { status: 500 });
        }

        if (!updates || updates.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Fetch profiles for the creators
        const userIds = [...new Set(updates.map(u => u.created_by).filter(Boolean))];
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, email")
            .in("id", userIds);

        // 3. Merge profiles into updates to polyfill created_by_name
        const profilesMap = (profiles || []).reduce((acc: any, p: any) => {
            acc[p.id] = p;
            return acc;
        }, {});

        const result = updates.map(update => {
            const profile = update.created_by ? profilesMap[update.created_by] : null;
            // Use profile name/email if available, otherwise fallback to existing column or 'System'
            const resolvedName = profile?.name || profile?.email || update.created_by_name || 'System';

            return {
                ...update,
                created_by_name: resolvedName,
                profiles: profile // Keep the profile object if needed
            };
        });

        console.log(`[API /leads/[id]/updates GET] Success: fetched ${result.length} updates for lead ID: ${id} (Service: ${serviceId || 'All'})`);
        return NextResponse.json(result);
    } catch (error) {
        console.error(`[API /leads/[id]/updates GET] Unexpected error (ID: ${id}):`, error);
        return NextResponse.json({ detail: "Failed to fetch lead updates" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createServerClient(request);
    const { id } = await params;
    try {
        const { content, type, service_id } = await request.json();

        // Get current user
        const { data: { user }, error: userError } = await (supabase.auth as any).getUser();
        if (userError || !user) {
            console.error(`[API /leads/[id]/updates POST] Unauthorized attempt (ID: ${id})`);
            return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
        }

        const newUpdate = {
            lead_id: parseInt(id),
            content,
            type: type || 'Note',
            created_by: user.id,
            service_id: service_id || null // Save the service linkage
        };

        const { data, error } = await supabase
            .from("lead_updates")
            .insert(newUpdate)
            .select()
            .single();

        if (error) {
            console.error(`[API /leads/[id]/updates POST] Supabase insert error (ID: ${id}):`, error);
            // Log payload for debugging
            console.error("Payload:", newUpdate);
            return NextResponse.json({ detail: error.message }, { status: 400 });
        }

        console.log(`[API /leads/[id]/updates POST] Success: added update to lead ID: ${id} (Service: ${service_id})`);
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error(`[API /leads/[id]/updates POST] Unexpected error (ID: ${id}):`, error);
        return NextResponse.json({ detail: "Failed to add lead update" }, { status: 500 });
    }
}
