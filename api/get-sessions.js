import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(200).json({ sessions: [] });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('sessions')
            .select('id, client_name, client_type, created_at, final_proposal, conversation_history')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error("Supabase fetch error:", error);
            return res.status(200).json({ sessions: [] });
        }

        return res.status(200).json({ sessions: data || [] });

    } catch (error) {
        console.error("Get sessions error:", error);
        return res.status(200).json({ sessions: [] });
    }
}