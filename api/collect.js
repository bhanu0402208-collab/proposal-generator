// This is a Vercel serverless function. It runs on Vercel's server, not in the browser.
// The browser sends a request to /api/collect, this function runs, calls Gemini
// using Google's official SDK, and sends the result back.
// The API key lives only here, never in browser code.

import { GoogleGenAI } from "@google/genai";

// We create the client once, outside the handler function.
// The SDK automatically reads process.env.GEMINI_API_KEY — we don't have to
// manually attach it to headers or URLs ourselves; the SDK handles whatever
// format Google currently requires internally.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    // Only allow POST requests — this function expects data sent to it, not just visited like a webpage.
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // req.body is whatever JSON the browser sent us. For this test, we expect { message: "..." }
    const { message } = req.body;

    try {
        // ai.models.generateContent is the SDK's method for sending a prompt and getting a reply.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: message,
        });

        // TEMPORARY DEBUG LINE — lets us see exactly what came back. We'll remove this soon.
        console.log("Gemini SDK response text:", response.text);

        return res.status(200).json({ reply: response.text || "No response generated." });
    } catch (error) {
        console.error("Gemini API error:", error);
        return res.status(500).json({ error: "Failed to get response from Gemini." });
    }
}