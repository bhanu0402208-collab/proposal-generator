import { createClient } from '@supabase/supabase-js';
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    const { clientName, clientType, history, proposal } = req.body;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        // Silently fail if not configured, as per "silent, no UI" requirement
        console.warn("Supabase credentials missing, skipping auto-save.");
        return res.status(200).json({ success: true, warning: "credentials_missing" });
    }
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase
            .from('sessions')
            .insert([
                {
                    client_name: clientName || "Unknown",
                    client_type: clientType || "Unknown",
                    conversation_history: history,
                    final_proposal: proposal
                }
            ]);
        if (error) {
            console.error("Supabase insert error:", error);
            // Silent to user, log internally
            return res.status(200).json({ success: true, warning: "db_error" });
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Supabase API error:", error);
        return res.status(200).json({ success: true, warning: "exception" });
    }
}
