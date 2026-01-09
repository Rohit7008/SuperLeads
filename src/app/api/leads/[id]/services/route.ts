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

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next.js 15+
) {
    const supabase = createServerClient(request);
    const { id } = await params;
    const leadId = parseInt(id);

    if (isNaN(leadId)) {
        return NextResponse.json({ detail: "Invalid Lead ID" }, { status: 400 });
    }

    try {
        const rawBody = await request.json();
        const { services, agent_ids } = rawBody; // Expecting array of service names

        if (!services || !Array.isArray(services) || services.length === 0) {
            return NextResponse.json({ detail: "No services provided" }, { status: 400 });
        }

        // Get current user
        const { data: { user }, error: userError } = await (supabase.auth as any).getUser();
        if (userError || !user) {
            return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
        }

        const createdServices = [];

        for (const serviceName of services) {
            // Create the service entry
            const { data: serviceData, error: serviceError } = await supabase
                .from("lead_services")
                .insert({
                    lead_id: leadId,
                    service_name: serviceName,
                    status: 'New', // Default status for new services
                    created_by: user.id
                })
                .select()
                .single();

            if (serviceError) {
                console.error(`[API Add Service] Failed for "${serviceName}": ${serviceError.message}`);
                continue;
            }

            createdServices.push(serviceData);

            // Log Activity
            const userName = user?.user_metadata?.full_name || user?.email || 'User';
            await supabase.from("lead_updates").insert({
                lead_id: leadId,
                content: `Added new service opportunity: "${serviceName}"`,
                type: 'Activity',
                created_by: user.id,
                created_by_name: userName,
                service_id: serviceData.id
            });
        }

        // If agents are provided, we might want to update the lead's agent list, 
        // but typically agents are assigned per client or per service. 
        // The current schema has `agent_ids` on `leads` table (Client Level).
        // If the user selects agents here, we should arguably append them to the Client.
        if (agent_ids && Array.isArray(agent_ids)) {
            // Logic to append agents could go here, but avoiding complexity for now unless requested.
        }

        return NextResponse.json({ success: true, created: createdServices }, { status: 201 });

    } catch (error: any) {
        console.error("[API Add Service] Error:", error);
        return NextResponse.json({ detail: error.message || "Failed to add services" }, { status: 500 });
    }
}
