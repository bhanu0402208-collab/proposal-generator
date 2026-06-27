// This is a Vercel serverless function. It runs on Vercel's server, not in the browser.
// The browser sends a request to /api/collect, this function runs, calls Gemini,
// and sends the result back. The API key lives only here, never in browser code.

export default async function handler(req, res) {
    // Only allow POST requests — this function expects data sent to it, not just visited like a webpage.
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // req.body is whatever JSON the browser sent us. For this test, we expect { message: "..." }
    const { message } = req.body;

    try {
        // Call Gemini's API directly using fetch, the same way a browser would call any web API.
        // process.env.GEMINI_API_KEY reads the key from our .env.local file (locally)
        // or from Vercel's environment variable settings (once deployed).
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: message }],
                        },
                    ],
                }),
            }
        );

        const data = await geminiResponse.json();
        console.log("Gemini raw response:", JSON.stringify(data, null, 2));

        // Gemini's reply text is nested inside this structure. We pull it out
        // so the browser gets a simple, clean response instead of Gemini's full raw format.
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

        return res.status(200).json({ reply: replyText });
    } catch (error) {
        console.error("Gemini API error:", error);
        return res.status(500).json({ error: "Failed to get response from Gemini." });
    }
}