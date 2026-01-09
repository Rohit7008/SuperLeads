import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: request.headers.get("Authorization") || "",
                }
            }
        }
    );

    const { data, error } = await supabase.from("profiles").select("*");

    if (error) {
        console.error("[API /users GET] Supabase error:", error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    console.log(`[API /users GET] Success: fetched ${data?.length || 0} profiles`);
    return NextResponse.json(data);
}

// Helper to get a Supabase client with Service Role (Admin) privileges
// This is needed to bypass RLS policies when updating other users' roles
const getAdminSupabase = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return null;
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );
};

export async function PUT(request: Request) {
    // 1. Create standard client to verify the requester's identity
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: request.headers.get("Authorization") || "",
                }
            }
        }
    );

    try {
        const body = await request.json();
        const { id, role } = body;

        if (!id || !role) {
            return NextResponse.json({ detail: "User ID and role are required" }, { status: 400 });
        }

        if (!['admin', 'user'].includes(role)) {
            return NextResponse.json({ detail: "Invalid role specified" }, { status: 400 });
        }

        // 2. Verify Auth: Get the current user
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !currentUser) {
            return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
        }

        // 3. Verify Permission: Check if current user is an admin
        const { data: currentProfile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();

        if (profileError || !currentProfile || currentProfile.role !== 'admin') {
            return NextResponse.json({ detail: "Forbidden: Admin access required" }, { status: 403 });
        }

        // 4. Perform Update:
        // Try to use Service Role client (bypasses RLS) if available.
        // If not, fallback to standard authenticated client and rely on RLS policies.
        let updateClient = getAdminSupabase();

        if (!updateClient) {
            console.warn("[API /users PUT] Missing SUPABASE_SERVICE_ROLE_KEY. Falling back to standard client (RLS required).");
            updateClient = supabase;
        }

        const { data, error } = await updateClient
            .from("profiles")
            .update({ role })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("[API /users PUT] Supabase error:", error);
            return NextResponse.json({ detail: "Database error: " + error.message }, { status: 500 });
        }

        console.log(`[API /users PUT] Success: Updated user ${id} to role ${role} by admin ${currentUser.id}`);
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[API /users PUT] Request error:", error);
        return NextResponse.json({ detail: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    // 1. Create standard client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: request.headers.get("Authorization") || "",
                }
            }
        }
    );

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ detail: "User ID is required" }, { status: 400 });
        }

        // 2. Verify Auth & Admin Role
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !currentUser) {
            return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
        }

        const { data: currentProfile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();

        if (profileError || !currentProfile || currentProfile.role !== 'admin') {
            return NextResponse.json({ detail: "Forbidden: Admin access required" }, { status: 403 });
        }

        // 3. Perform Reassignment & Deletion
        const adminSupabase = getAdminSupabase();
        if (!adminSupabase) {
            return NextResponse.json({ detail: "Server misconfiguration: Service Role missing" }, { status: 500 });
        }

        const adminId = currentUser.id;

        // A. Reassign Leads (Client Profiles)
        const { error: leadsError } = await adminSupabase
            .from("leads")
            .update({ created_by: adminId })
            .eq("created_by", id);

        if (leadsError) {
            console.error("[API /users DELETE] Failed to reassign leads:", leadsError);
            return NextResponse.json({ detail: "Failed to reassign Data (Leads): " + leadsError.message }, { status: 500 });
        }

        // B. Reassign Lead Services (Pipelines)
        const { error: servicesError } = await adminSupabase
            .from("lead_services")
            .update({ created_by: adminId })
            .eq("created_by", id);

        if (servicesError) {
            console.error("[API /users DELETE] Failed to reassign services:", servicesError);
            return NextResponse.json({ detail: "Failed to reassign Data (Services): " + servicesError.message }, { status: 500 });
        }

        // C. Delete from Auth (Casacdes to Profiles usually)
        const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(id);

        if (deleteError) {
            console.error("[API /users DELETE] Auth delete error:", deleteError);
            return NextResponse.json({ detail: "Failed to delete user: " + deleteError.message }, { status: 500 });
        }

        console.log(`[API /users DELETE] Success: User ${id} deleted by admin ${currentUser.id}. Assets reassigned.`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[API /users DELETE] Request error:", error);
        return NextResponse.json({ detail: error.message || "Internal Server Error" }, { status: 500 });
    }
}
