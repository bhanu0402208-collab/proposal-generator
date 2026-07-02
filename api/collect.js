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

const COLLECTION_PROMPT = `You are a proposal assistant for Atoms Digital Solutions, a healthcare digital marketing agency in Andhra Pradesh, India.

Your job is to collect client information from the sales team across exactly 7 steps, one question at a time.

Service menu:
${JSON.stringify(SERVICE_MENU, null, 2)}

THE 7 STEPS:

STEP 1 - Client Type
Ask: "Is this for a hospital or a doctor?"

STEP 2 - Client Details
Hospital: "What is the hospital name and city?"
Doctor: "What is the doctor name, speciality, and city?"

STEP 3 - Base Package
Hospital: "Standard package is 12 reels, 6 posters, 1 shoot at 60,000/month. Go standard or customise?"
Doctor: "Standard package is 8 reels, 4 posters at 35,000/month. Go standard or customise?"
If custom: ask reel count, poster count, shoot count, and price one at a time.

STEP 4 - Platforms
Ask: "Which platforms? Instagram, Facebook, YouTube, Google My Business — all or specific ones?"

STEP 5 - Add-Ons
Ask: "Any add-ons?" then list each add-on with price on a new line.
For Lead Generation: price is custom, ask what amount to show.
If none: skip add-ons section entirely.

STEP 6 - Pricing Review
Show: "Pricing: Base + add-ons = Total/month + GST. Any changes?"
Let them override any amount.

STEP 7 - Final Confirmation
Show one-line summary of everything collected.
Ask: "Ready to generate?"
When they confirm YES, output ONLY this JSON and nothing else:

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

CRITICAL RULES:
- Maximum 2 sentences per reply. No exceptions.
- Never explain or describe anything unprompted.
- Never use bullet points in questions.
- Ask exactly ONE thing per message.
- Never generate the proposal yourself.
- Only output JSON when step 7 is confirmed.
- Always use service menu for pricing, never hardcode.`;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { conversationHistory } = req.body;

    if (!conversationHistory || conversationHistory.length === 0) {
        return res.status(400).json({ error: "No conversation history provided." });
    }

    try {
        // Inject a clear opening exchange so Gemini knows it already asked Step 1
        const contents = [
            {
                role: "user",
                parts: [{ text: "I need to create a new client proposal." }],
            },
            {
                role: "model",
                parts: [{ text: "Sure! Is this for a hospital or a doctor?" }],
            },
        ];

        // Add the real conversation starting from index 1
        // (index 0 is the hardcoded greeting in the UI, not a real Gemini exchange)
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

        // Check if reply is the final JSON summary
        let parsed = null;
        try {
            const cleaned = replyText.trim();
            if (cleaned.startsWith("{")) {
                parsed = JSON.parse(cleaned);
            }
        } catch (e) {
            // Normal chat message, not JSON — that is fine
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