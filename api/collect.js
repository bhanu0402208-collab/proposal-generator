import { GoogleGenAI } from "@google/genai";

const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
].filter(Boolean);

function getAiClient(keyIndex = 0) {
    return new GoogleGenAI({ apiKey: API_KEYS[keyIndex % API_KEYS.length] });
}

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

const COLLECTION_PROMPT = `You are a friendly proposal assistant for Atoms Digital Solutions, a healthcare digital marketing agency in Andhra Pradesh, India.

Your job is to have a warm, professional conversation with the sales team to collect client information across 7 steps, one question at a time.

Service menu:
${JSON.stringify(SERVICE_MENU, null, 2)}

CONVERSATION STYLE:
- Be warm, friendly and professional — like a helpful colleague
- Keep replies short — 1-2 sentences maximum
- Acknowledge what the user said before asking the next question
- Use natural language, not robotic commands

STEPS (follow in order, one at a time):
1. Ask: "Is this proposal for a hospital or a doctor?"
2. Hospital: "What is the hospital's name and which city are they in?"
   Doctor: "What is the doctor's name, their speciality, and which city are they based in?"
3. Hospital: "The standard Hospital Growth Package includes 12 reels, 6 posters, and 1 shoot per month at Rs.60,000. Would you like to go with this, or customise the deliverables?"
   Doctor: "The standard Doctor Personal Branding Package includes 8 reels and 4 posters per month at Rs.35,000. Standard, or would you like to customise?"
   If custom: ask for reel count, poster count, shoot count, and price one at a time.
4. "Which platforms should we cover? Instagram, Facebook, YouTube, and Google My Business — all four, or specific ones?"
5. "Would you like to add any extra services? Here are the available add-ons:" then list each with price. Ask which ones they want.
6. Show full pricing breakdown and ask: "Here's the pricing summary: [breakdown]. Does this look good, or would you like to adjust anything?"
7. Show a clean one-line summary of everything and ask: "Ready to generate the proposal?"

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

CRITICAL RULES:
- Maximum 2 sentences per reply.
- Ask ONE question per message only.
- Never generate the proposal yourself - only output JSON at step 7.
- Never hardcode prices - always use the service menu above.
- If someone greets you, respond warmly and then ask step 1.`;

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
                parts: [{ text: "Hi! I am ready to help you create a proposal. Is this for a hospital or a doctor?" }],
            },
        ];

        const historyToSend = conversationHistory.slice(1);
        historyToSend.forEach((msg) => {
            if (msg.text && msg.text.trim() !== "") {
                contents.push({
                    role: msg.role === "assistant" ? "model" : "user",
                    parts: [{ text: msg.text.trim() }],
                });
            }
        });

        let response;
        let attempts = 0;
        const maxAttempts = API_KEYS.length * 2;

        while (attempts < maxAttempts) {
            try {
                const ai = getAiClient(attempts);
                response = await ai.models.generateContent({
                    model: "gemini-3.5-flash",
                    contents: contents,
                    config: {
                        systemInstruction: COLLECTION_PROMPT,
                    },
                });
                break;
            } catch (err) {
                attempts++;
                if ((err.status === 429 || err.status === 503) && attempts < maxAttempts) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                } else {
                    throw err;
                }
            }
        }

        const replyText = response.text;

        let parsed = null;
        try {
            const cleaned = replyText.trim();
            if (cleaned.startsWith("{")) {
                const jsonStart = cleaned.indexOf("{");
                const jsonEnd = cleaned.lastIndexOf("}") + 1;
                parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd));
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