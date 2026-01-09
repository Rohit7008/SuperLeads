/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const supabase = createServerClient(request);

    const { data: service, error } = await supabase
        .from("lead_services")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(service);
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const supabase = createServerClient(request);

    try {
        const updates = await request.json();

        // 1. Get Current User for Logging
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        // 2. Fetch Existing State for Comparison
        const { data: existing, error: fetchError } = await supabase
            .from("lead_services")
            .select("*, leads(name)")
            .eq("id", id)
            .single();

        if (fetchError || !existing) throw new Error("Service not found");

        // 3. Update Service
        const { data: updated, error } = await supabase
            .from("lead_services")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // 4. Generate Change Log
        const changes: string[] = [];

        if (updates.coverage !== undefined && updates.coverage !== existing.coverage) {
            changes.push(`Updated Coverage: ${existing.coverage || 'N/A'} → ${updates.coverage}`);
        }
        if (updates.premium_investment !== undefined && updates.premium_investment !== existing.premium_investment) {
            changes.push(`Updated Premium: ${existing.premium_investment || '0'} → ${updates.premium_investment}`);
        }
        if (updates.status !== undefined && updates.status !== existing.status) {
            changes.push(`Status Changed: ${existing.status} → ${updates.status}`);
        }
        if (updates.discussion_date !== undefined && updates.discussion_date !== existing.discussion_date) {
            const oldDate = existing.discussion_date ? new Date(existing.discussion_date).toLocaleDateString() : 'None';
            const newDate = new Date(updates.discussion_date).toLocaleDateString();
            if (oldDate !== newDate) changes.push(`Discussion Rescheduled: ${oldDate} → ${newDate}`);
        }
        if (updates.follow_up_date !== undefined && updates.follow_up_date !== existing.follow_up_date) {
            const oldDate = existing.follow_up_date ? new Date(existing.follow_up_date).toLocaleDateString() : 'None';
            const newDate = new Date(updates.follow_up_date).toLocaleDateString();
            if (oldDate !== newDate) changes.push(`Follow-up Rescheduled: ${oldDate} → ${newDate}`);
        }

        // 5. Insert Log if there are changes
        if (changes.length > 0) {
            const userName = user?.user_metadata?.full_name || user?.email || 'User';
            const logContent = `Updates to ${existing.service_name} Pipeline:\n${changes.join('\n')}`;
            await supabase.from("lead_updates").insert({
                lead_id: existing.lead_id,
                content: logContent,
                type: 'Activity',
                created_by_name: userName
            });
        }

        return NextResponse.json(updated);
    } catch (e) {
        console.error("Update Error:", e);
        return NextResponse.json({ detail: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const supabase = createServerClient(request);

    try {
        // 1. Get Current User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        // 2. Get Service to find Parent Lead ID
        const { data: service, error: fetchError } = await supabase
            .from("lead_services")
            .select("lead_id, service_name")
            .eq("id", id)
            .single();

        if (fetchError || !service) {
            return NextResponse.json({ detail: "Service not found" }, { status: 404 });
        }

        // 3. Delete Service
        const { error } = await supabase
            .from("lead_services")
            .delete()
            .eq("id", id);

        if (error) throw error;

        // 4. Log Deletion
        const userName = user?.user_metadata?.full_name || user?.email || 'User';
        await supabase.from("lead_updates").insert({
            lead_id: service.lead_id,
            content: `Deleted Pipeline: ${service.service_name}`,
            type: 'Activity',
            created_by_name: userName
        });

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("Delete Error:", e);
        return NextResponse.json({ detail: e.message || "Delete failed" }, { status: 500 });
    }
}
