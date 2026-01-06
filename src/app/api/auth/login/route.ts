import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ detail: "Email and password are required" }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("[API /auth/login POST] Auth error:", error.message);
            return NextResponse.json({ detail: error.message }, { status: 401 });
        }

        console.log(`[API /auth/login POST] Success: user ${email} logged in`);
        return NextResponse.json({
            access_token: data.session?.access_token,
            user: data.user,
        });
    } catch (error) {
        console.error("[API /auth/login POST] Unexpected error:", error);
        return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
    }
}
