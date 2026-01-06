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

    try {
        // 1. Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch all lead updates created by this user
        // We also want to join with leads to get the client name
        const { data: updates, error: updatesError } = await supabase
            .from("lead_updates")
            .select(`
                *,
                leads (
                    id,
                    name,
                    service
                )
            `)
            .eq("created_by", user.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (updatesError) {
            console.error("[API /activities GET] Supabase error:", updatesError);
            return NextResponse.json({ detail: updatesError.message }, { status: 500 });
        }

        console.log(`[API /activities GET] Success: fetched ${updates?.length || 0} activities for user ${user.id}`);
        return NextResponse.json(updates);
    } catch (error) {
        console.error("[API /activities GET] Unexpected error:", error);
        return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
}
