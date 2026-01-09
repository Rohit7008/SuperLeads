import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch Client Profile (leads table) AND related services
        const { data: client, error } = await supabase
            .from("leads")
            .select(`
                *,
                lead_services (*)
            `)
            .eq("id", id)
            .single();

        if (error) {
            console.error("Supabase error fetching client:", error);
            return NextResponse.json(
                { detail: "Client not found or database error" },
                { status: 404 }
            );
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error("Error in GET /api/leads/client/[id]:", error);
        return NextResponse.json(
            { detail: "Internal Server Error" },
            { status: 500 }
        );
    }
}
