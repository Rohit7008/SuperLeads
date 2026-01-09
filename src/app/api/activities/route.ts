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

export async function GET(request: Request) {
    const supabase = createServerClient(request);
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    try {
        // 1. Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
        }

        // 2. Determine whose activities to fetch
        let userIdToFetch = user.id;
        let useServiceRole = false;

        if (targetUserId && targetUserId !== user.id) {
            // Check if current user is admin
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role === 'admin') {
                userIdToFetch = targetUserId;
                useServiceRole = true; // Use service role to see other's data if RLS restricts
            } else {
                return NextResponse.json({ detail: "Forbidden: Admin access required to view other users" }, { status: 403 });
            }
        }

        // 3. Create client for query (Service Role if needed/available, else standard)
        let queryClient = supabase;
        if (useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            queryClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
        }

        // 4. Fetch activities
        const { data: updates, error: updatesError } = await queryClient
            .from("lead_updates")
            .select(`
                *,
                leads (
                    id,
                    name,
                    phone_number,
                    lead_services (
                        service_name
                    )
                )
            `)
            .eq("created_by", userIdToFetch)
            .order("created_at", { ascending: false })
            .limit(50);

        if (updatesError) {
            console.error("[API /activities GET] Supabase error:", updatesError);
            return NextResponse.json({ detail: updatesError.message }, { status: 500 });
        }

        if (!updates || updates.length === 0) {
            return NextResponse.json([]);
        }

        // 3. Fetch profiles for the creators
        const userIds = [...new Set(updates.map(u => u.created_by).filter(Boolean))];
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, email")
            .in("id", userIds);

        // 4. Merge profiles and DETECT SERVICE context
        const profilesMap = (profiles || []).reduce((acc: any, p: any) => {
            acc[p.id] = p;
            return acc;
        }, {});

        const result = updates.map(update => {
            const profile = update.created_by ? profilesMap[update.created_by] : null;
            const resolvedName = profile?.name || profile?.email || update.created_by_name || 'System';

            // Get all services for this lead
            const allServices = update.leads?.lead_services?.map((s: any) => s.service_name) || [];

            // LOGIC: Try to find which service this update is about by checking content
            // Sort services by length descending to match "Service Name Extended" before "Service Name"
            const sortedServices = [...allServices].sort((a, b) => b.length - a.length);

            let detectedService = null;
            if (update.content) {
                detectedService = sortedServices.find(s => update.content.includes(s));
            }

            // If detected, show ONLY that service. If not, fallback to joining all (or "General")
            // The user prefers specific assignment, so if we can't match, maybe showing all is safer,
            // or showing "Client Note" might be better. 
            // Current behavior fallback: Join all. 
            const displayService = detectedService || allServices.join(", ");

            return {
                ...update,
                created_by_name: resolvedName,
                profiles: profile,
                leads: {
                    ...update.leads,
                    service: displayService // Now holds specific service or comma-list
                }
            };
        });

        console.log(`[API /activities GET] Success: fetched ${result.length} activities for user ${user.id}`);
        return NextResponse.json(result);
    } catch (error) {
        console.error("[API /activities GET] Unexpected error:", error);
        return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
}
