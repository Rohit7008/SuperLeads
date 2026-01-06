import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSchema() {
    const { data, error } = await supabase
        .from("lead_updates")
        .select("*")
        .limit(1);

    if (error) {
        console.error("Error fetching lead_updates:", error);
    } else {
        console.log("Sample lead_update:", data[0]);
        console.log("Keys available:", Object.keys(data[0] || {}));
    }
}

checkSchema();
