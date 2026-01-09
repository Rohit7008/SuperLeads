
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ detail: "User ID is required" }, { status: 400 });
    }

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

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error(`[API /users/${id} GET] Supabase error:`, error);
        return NextResponse.json({ detail: "User not found or error fetching profile" }, { status: 404 });
    }

    return NextResponse.json(profile);
}
