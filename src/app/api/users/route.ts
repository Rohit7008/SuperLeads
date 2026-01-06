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
