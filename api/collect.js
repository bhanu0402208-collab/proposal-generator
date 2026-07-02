import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SERVICE_MENU = {
    basePackages: {
        hospital: {
            name: "Hospital Growth Package",
            reels: 12, posters: 6, shoots: 1,
            platforms: ["Instagram", "Facebook", "YouTube", "Google My Business"],
            basePrice: 60000
        },
        doctor: {
            name: "Doctor Personal Branding Package",
            reels: 8, posters: 4, shoots: 0,
            platforms: ["Instagram", "Facebook", "YouTube", "Google My Business"],
            basePrice: 35000
        }
    },
    addOns: [
        { id: "meta_ads", name: "Meta Ads Management", price: 6000 },
        { id: "google_ads", name: "Google Ads Management", price: 12000 },
        { id: "meta_google_ads", name: "Meta + Google Ads", price: 15000 },
        { id: "lead_generation", name: "Lead Generation", price: null },
        { id: "conversion_support", name: "Conversion Support (LMT)", price: 15000 },
        { id: "basic_seo", name: "Basic SEO", price: 10000 },
        { id: "advanced_seo", name: "Advanced SEO", price: 20000 },
        { id: "website_management", name: "Website Management", price: 5000 },
        { id: "advanced_strategy", name: "Advanced Strategy & Research", price: 8000 },
        { id: "extra_reel", name: "Extra Reel", price: 1000 },
        { id: "extra_poster", name: "Extra Poster", price: 500 },
        { id: "regular_shoot", name: "Regular Shoot (extra)", price: 5000 },
        { id: "premium_shoot", name: "Premium Shoot", price: 10000 }
    ]
};

const COLLECTION_PROMPT = `You are a proposal assistant for Atoms Digital Solutions.
You collect client info across 7 steps. One question per reply. Maximum 15 words per reply.

Service menu:
${JSON.stringify(SERVICE_MENU, null, 2)}

STEPS:
1. Ask: "Hospital or doctor?"
2. Hospital: "Hospital name and city?" / Doctor: "Doctor name, speciality, and city?"
3. Hospital: "Standard: 12 reels, 6 posters, 1 shoot at Rs.60,000/month. Standard or custom?" / Doctor: "Standard: 8 reels, 4 posters at Rs.35,000/month. Standard or custom?"
4. Ask: "Platforms: Instagram, Facebook, YouTube, GMB — all or specific?"
5. Ask: "Any add-ons?" If yes, list each with price, one per line. Ask which they want.
6. Show: "Total: Base + addons = X/month + GST. Any changes?"
7. Show one-line summary. Ask: "Ready to generate?"

On confirmation at step 7, output ONLY this JSON, nothing else:
{
  "complete": true,
  "clientType": "hospital or doctor",
  "clientName": "...",
  "city": "...",
  "speciality": null,
  "packageName": "...",
  "reels": 12,
  "posters": 6,
  "shoots": 1,
  "platforms": ["Instagram", "Facebook", "YouTube", "Google My Business"],
  "addOns": [],
  "basePrice": 60000,
  "totalPrice": 60000,
  "currency": "INR"
}

RULES — NEVER BREAK THESE:
1. Maximum 15 words per reply. Count your words before responding.
2. One question per message only.
3. No greetings, no pleasantries, no explanations.
4. No bullet points in questions.
5. Never generate the proposal — only output JSON at step 7.
6. Never hardcode prices — use service menu above.`;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { conversationHistory } = req.body;

    if (!conversationHistory || conversationHistory.length === 0) {
        return res.status(400).json({ error: "No conversation history provided." });
    }

    try {
        const contents = [
            {
                role: "user",
                parts: [{ text: "Start a new proposal." }],
            },
            {
                role: "model",
                parts: [{ text: "Hospital or doctor?" }],
            },
        ];

        const historyToSend = conversationHistory.slice(1);
        historyToSend.forEach((msg) => {
            contents.push({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.text }],
            });
        });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: COLLECTION_PROMPT,
            },
        });

        const replyText = response.text;

        let parsed = null;
        try {
            const cleaned = replyText.trim();
            if (cleaned.startsWith("{")) {
                parsed = JSON.parse(cleaned);
            }
        } catch (e) {
            // Normal chat message
        }

        return res.status(200).json({
            reply: replyText,
            parsed: parsed,
        });

    } catch (error) {
        console.error("Gemini API error:", error);
        return res.status(500).json({ error: "Failed to get response from Gemini." });
    }
}