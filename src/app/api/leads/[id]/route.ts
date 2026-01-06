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
    try {
        const { data, error } = await supabase
            .from("leads")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            return NextResponse.json({ detail: error.message }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ detail: "Failed to fetch lead" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createServerClient(request);
    const { id } = await params;
    try {
        const rawBody = await request.json();

        // 1. Fetch current lead state for audit comparison
        const { data: currentLead, error: fetchError } = await supabase
            .from("leads")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError || !currentLead) {
            return NextResponse.json({ detail: "Lead not found for audit" }, { status: 404 });
        }

        // 2. Sanitize and map body to DB schema
        const body: any = {};
        const changes: string[] = [];
        const { data: { user } } = await (supabase.auth as any).getUser();
        const fallbackName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User';
        const performer = rawBody.updated_by_name || fallbackName;

        const trackChange = (field: string, newValue: any, label: string) => {
            if (newValue === undefined) return;

            const currentValue = currentLead[field];
            const hasChanged = Array.isArray(newValue)
                ? JSON.stringify(newValue.sort()) !== JSON.stringify((currentValue || []).sort())
                : newValue !== currentValue;

            if (hasChanged) {
                body[field] = newValue;

                if (field === 'is_converted' && newValue === true) {
                    changes.push(`Lead marked as converted by "${performer}"`);
                } else if (field === 'agent_ids') {
                    const fromCount = (currentValue || []).length;
                    const toCount = (newValue || []).length;
                    changes.push(`Assigned Agents updated: ${fromCount} → ${toCount} by "${performer}"`);
                } else {
                    const fromVal = Array.isArray(currentValue) ? (currentValue.length > 0 ? currentValue.join(', ') : 'None') : (currentValue || 'None');
                    const toVal = Array.isArray(newValue) ? (newValue.length > 0 ? newValue.join(', ') : 'None') : newValue;
                    changes.push(`${label} changed from "${fromVal}" to "${toVal}"`);
                }
            }
        };

        trackChange("name", rawBody.name, "Name");
        trackChange("phone_number", rawBody.phone_number, "Phone");
        trackChange("service", rawBody.service, "Service");
        trackChange("description", rawBody.description, "Description");
        trackChange("status", rawBody.status, "Status");
        trackChange("follow_up_date", rawBody.follow_up_date, "Follow-up Date");
        trackChange("is_converted", rawBody.is_converted, "Conversion Status");
        trackChange("agent_ids", rawBody.agent_ids, "Assigned Agents");

        if (rawBody.meeting_date || rawBody.date) {
            const newDate = rawBody.meeting_date || rawBody.date;
            if (newDate !== (currentLead.date || currentLead.meeting_date)) {
                body.date = newDate;
                changes.push(`Meeting Date updated to "${newDate}"`);
            }
        }

        if (Object.keys(body).length === 0) {
            return NextResponse.json(currentLead); // No changes detected
        }

        // 3. Update the lead
        const { data, error } = await supabase
            .from("leads")
            .update(body)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error(`[API /leads/[id] PUT] Supabase update error (ID: ${id}):`, error);
            return NextResponse.json({ detail: error.message }, { status: 400 });
        }

        // 4. Log all detected changes to the pipeline
        if (changes.length > 0) {
            const { data: { user } } = await (supabase.auth as any).getUser();
            const logEntries = changes.map(change => ({
                lead_id: parseInt(id),
                content: change,
                type: change.includes("Status") ? 'Status' : 'Activity',
                created_by: user?.id
            }));

            await supabase.from("lead_updates").insert(logEntries);
        }

        console.log(`[API /leads/[id] PUT] Success: updated lead ID: ${id}. Changes: ${changes.length}`);
        return NextResponse.json(data);
    } catch (error) {
        console.error(`[API /leads/[id] PUT] Unexpected error (ID: ${id}):`, error);
        return NextResponse.json({ detail: "Failed to update lead" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createServerClient(request);
    const { id } = await params;
    try {
        const { error } = await supabase
            .from("leads")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(`[API /leads/[id] DELETE] Supabase delete error (ID: ${id}):`, error);
            return NextResponse.json({ detail: error.message }, { status: 400 });
        }

        console.log(`[API /leads/[id] DELETE] Success: deleted lead ID: ${id}`);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`[API /leads/[id] DELETE] Unexpected error (ID: ${id}):`, error);
        return NextResponse.json({ detail: "Failed to delete lead" }, { status: 500 });
    }
}
