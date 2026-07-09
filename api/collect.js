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

const COLLECTION_PROMPT = `You are a friendly sales assistant for Atoms Digital Solutions, a healthcare digital marketing agency in Andhra Pradesh, India.

You collect client information across 7 steps through a warm, professional conversation.

Service menu:
${JSON.stringify(SERVICE_MENU, null, 2)}

GST RULE: Always calculate GST at 18%. Total = Subtotal + 18% GST.

CONVERSATION STYLE:
- Be warm, friendly and professional like a helpful human colleague
- Keep replies short - 1-2 sentences maximum
- Acknowledge what the user said before asking the next question

STEPS (follow in order, one at a time):

STEP 1: Ask "Is this proposal for a hospital or a doctor?"

STEP 2:
- Hospital: "What is the hospital's name and which city are they in?"
- Doctor: "What is the doctor's name, their speciality, and which city are they based in?"

STEP 3:
- Hospital: "The standard Hospital Growth Package includes 12 reels, 6 posters, and 1 shoot per month at Rs.60,000. Would you like to go with this, or customise the deliverables?"
- Doctor: "The standard Doctor Personal Branding Package includes 8 reels and 4 posters per month at Rs.35,000. Standard, or customise?"
- If custom: ask for reel count, poster count, shoot count, and price one at a time.

STEP 4: "Which platforms should we cover? Instagram, Facebook, YouTube, and Google My Business - all four, or specific ones?"

STEP 5: WITHOUT waiting to be asked, automatically show:
"Here are our available add-ons:
- Meta Ads Management - Rs.6,000/month
- Google Ads Management - Rs.12,000/month
- Meta + Google Ads - Rs.15,000/month
- Lead Generation - Custom pricing
- Conversion Support (LMT) - Rs.15,000/month
- Basic SEO - Rs.10,000/month
- Advanced SEO - Rs.20,000/month
- Website Management - Rs.5,000/month
- Advanced Strategy & Research - Rs.8,000/month
- Extra Reel - Rs.1,000/reel
- Extra Poster - Rs.500/poster
- Regular Shoot - Rs.5,000
- Premium Shoot - Rs.10,000
Which of these would you like to add? (Type 'none' to skip)"

STEP 6: Show full pricing WITH GST:
"Here's the pricing summary:
Base package: Rs.X
Add-ons: Rs.X
Subtotal: Rs.X/month
GST (18%): Rs.X
Total: Rs.X/month (inclusive of GST)
Would you like to adjust anything?"

STEP 7: Show one-line summary and ask "Ready to generate the proposal?"
When they confirm YES, immediately output ONLY the JSON below with absolutely no other text before or after it:

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
  "addOns": [{"name": "...", "price": 0}],
  "basePrice": 60000,
  "addOnsTotal": 0,
  "subtotal": 60000,
  "gst": 10800,
  "totalPrice": 70800,
  "currency": "INR"
}

CRITICAL RULES - NEVER BREAK THESE:
- Maximum 2 sentences per reply.
- Ask ONE question per message only.
- NEVER explain your limitations or capabilities.
- NEVER say you cannot do something.
- NEVER mention JSON, PDF, or documents to the user during conversation.
- NEVER break character - you are a human sales assistant, not an AI.
- At step 7 confirmation, output ONLY the JSON with zero other text.
- Never hardcode prices - always use the service menu above.
- Always calculate GST at 18%.
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
                    model: "gemini-2.5-flash",
                    contents: contents,
                    config: {
                        systemInstruction: COLLECTION_PROMPT,
                        maxOutputTokens: 8192,
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
            // Strip markdown code fences if AI wrapped the JSON
            let cleaned = replyText.trim();
            cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
            cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

            // Find the JSON object
            const jsonStart = cleaned.indexOf("{");
            const jsonEnd = cleaned.lastIndexOf("}") + 1;
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
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
        return res.status(500).json({ error: error.message || "Failed to get response from Gemini." });
    }
}