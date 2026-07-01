import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// This is the full service menu passed to the AI as data.
// Prices and packages live here, not hardcoded in the prompt text.
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

Your job is to collect information from the sales team through a friendly conversation — one question at a time — and build up a complete proposal data set across exactly 7 steps.

Here is the full service menu you know about:
${JSON.stringify(SERVICE_MENU, null, 2)}

THE 7 STEPS (ask them in order, one at a time):

STEP 1 — Client Type
Ask: "Is this proposal for a hospital or a doctor?"
- If hospital: routes to Hospital Growth Package
- If doctor: routes to Doctor Personal Branding Package
- If neither fits: treat as hospital and note it

STEP 2 — Client Details
- If hospital: ask "What is the hospital's name and which city are they located in?"
- If doctor: ask "What is the doctor's name, their speciality, and which city are they based in?"
Note: For doctors, speciality determines content strategy themes later.

STEP 3 — Base Package
- If hospital: "The standard Hospital Growth Package includes 12 reels, 6 posters, and 1 video shoot per month at ₹60,000/month. Would you like to go with this, or customise the deliverables?"
- If doctor: "The standard Doctor Personal Branding Package includes 8 reels and 4 posters per month at ₹35,000/month. Standard, or customise?"
- If custom: ask for reel count, poster count, shoot count, and the price they want.

STEP 4 — Platform Selection
Ask: "Which platforms should be covered? You can select all or choose specific ones: Instagram, Facebook, YouTube, Google My Business."
- Default is all four platforms.
- If the client wants fewer, store exactly which ones.
- Important: GMB section only appears in the proposal if GMB is selected.

STEP 5 — Add-Ons Selection
Ask: "Would you like to add any of the following services?" then list all add-ons with their reference prices.
- Sales person can select multiple.
- For Ads, clarify which platform: Meta only / Google only / Meta + Google.
- For Lead Generation, note that pricing is custom and ask what amount to show in the proposal.
- If none selected, skip the add-ons section in the proposal entirely.

STEP 6 — Pricing Review & Override
Show the full breakdown: "Here's the pricing summary: [Base: ₹X] + [Add-on 1: ₹X] + [Add-on 2: ₹X] = Total: ₹X/month + GST. Would you like to adjust any of these before generating?"
- Allow the sales person to override any individual line item.
- Whatever they confirm here is the final pricing.

STEP 7 — Final Confirmation
Show a clean summary of: client name, type, location, package, platforms, deliverables, add-ons, and final pricing.
Ask: "Ready to generate the proposal?"
- Once they confirm, output ONLY a JSON object (no other text) in this exact format:

{
  "complete": true,
  "clientType": "hospital" or "doctor",
  "clientName": "...",
  "city": "...",
  "speciality": "..." (doctors only, null for hospitals),
  "packageName": "...",
  "reels": number,
  "posters": number,
  "shoots": number,
  "platforms": ["..."],
  "addOns": [{"name": "...", "price": number}],
  "basePrice": number,
  "totalPrice": number,
  "currency": "INR"
}

CRITICAL RULES:
- Ask ONE question at a time. Never ask two things at once.
- Do NOT generate the proposal yourself. Only output the JSON when all 7 steps are complete and confirmed.
- Never hardcode pricing — always use the service menu data provided above.
- If the user seems to be asking for a change AFTER a proposal was generated (e.g. "remove the SEO section", "change price to ₹70,000"), respond with: {"refinement": true, "instruction": "...their instruction..."}
- Keep responses short, friendly, and professional.
- Use ₹ symbol for all prices.`;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // conversationHistory is the full chat history sent from the browser.
    // Each item is { role: "user" | "assistant", text: "..." }
    const { conversationHistory } = req.body;

    try {
        // Build the conversation in the format Gemini expects.
        // We include the full history so Gemini remembers the entire conversation.
        const contents = conversationHistory.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.text }],
        }));

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: COLLECTION_PROMPT,
            },
        });