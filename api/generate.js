import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// FIXED SECTIONS — these appear verbatim in every proposal, never rewritten.
const FIXED_HEADER = `Atoms Digital Solutions Private Limited
CIN: U74999AP2022PTC133342
Email: atomsdigitalsolutions@gmail.com | Phone: +91 98765 43210
DIGITAL MARKETING PROPOSAL`;

const FIXED_OBJECTIVES = `OBJECTIVES OF DIGITAL MARKETING
- Build a strong and consistent digital presence
- Increase visibility and brand awareness among target patients
- Educate patients through valuable and relevant content
- Build trust and credibility through doctor-led content
- Drive appointment bookings and patient enquiries
- Improve Google search rankings and local discoverability
- Strengthen reputation through patient testimonials and reviews`;

const FIXED_IMPORTANT_NOTES = `IMPORTANT NOTES
- Ad budget is separate from the management fee quoted above
- Results depend on consistency of content creation and posting
- Doctor/hospital participation improves content performance significantly
- 4-day lead time required for additional design requests`;

const FIXED_FOOTER = `Atoms Digital Solutions Private Limited
Flat No. 301, Sri Siva Sankari Nilayam, Gorantla, Guntur - 522034, Andhra Pradesh
atomsdigitalsolutions@gmail.com | +91 98765 43210`;

const FIXED_WHY_ATOMS = `WHY ATOMS DIGITAL SOLUTIONS?
- Specialized exclusively in healthcare digital marketing
- Deep understanding of patient psychology and medical content
- Proven track record with hospitals and clinics across Andhra Pradesh
- Dedicated content team with medical communication expertise
- Transparent reporting and consistent communication`;

const GENERATION_PROMPT = `You are a proposal writer for Atoms Digital Solutions, a healthcare digital marketing agency.

You will receive a JSON object with all the client details collected during the sales conversation.
Your job is to generate a complete, professional proposal document in clean HTML.

THE PROPOSAL MUST FOLLOW THIS EXACT SECTION ORDER:
1. Header (FIXED — use verbatim, never rewrite)
2. Client Title Block (VARIABLE — fill from JSON data)
3. Overview / Understanding Your Requirement (CUSTOMISABLE — write 2-3 paragraphs based on client type, speciality, location)
4. Objectives of Digital Marketing (FIXED — use verbatim, never rewrite)
5. Recommended Service Scope (CUSTOMISABLE — one sub-section per selected service only)
6. Monthly Deliverables (VARIABLE — only if social media selected, show exact counts from JSON)
7. Content Strategy (CUSTOMISABLE — only if social media selected, tailor to speciality/hospital type)
8. Optional Add-Ons (CUSTOMISABLE — only if add-ons were selected, list them)
9. Pricing (VARIABLE — use exact figures from JSON, never change them)
10. Important Notes (FIXED — use verbatim, never rewrite)
11. Why Atoms (FIXED — use verbatim, never rewrite)
12. Conclusion / Next Steps (CUSTOMISABLE — 2-3 sentences, personalised to client name)
13. Footer (FIXED — use verbatim, never rewrite)

FIXED SECTIONS (copy these word for word, do not change a single character):

HEADER:
${FIXED_HEADER}

OBJECTIVES:
${FIXED_OBJECTIVES}

IMPORTANT NOTES:
${FIXED_IMPORTANT_NOTES}

WHY ATOMS:
${FIXED_WHY_ATOMS}

FOOTER:
${FIXED_FOOTER}

HTML FORMATTING RULES:
- Output clean HTML only. No markdown, no backticks, no explanation text.
- Use inline styles for formatting. Keep it clean and printable.
- Use a white background, dark text, professional font (Arial or similar).
- Each section should have a clear heading.
- Pricing should be displayed as a clear table.
- The document should look professional enough to send directly to a client.`;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { proposalData, refinementInstruction, currentHtml } = req.body;

    if (!proposalData && !refinementInstruction) {
        return res.status(400).json({ error: "proposalData or refinementInstruction required." });
    }

    try {
        let prompt;

        if (refinementInstruction && currentHtml) {
            // This is a refinement request — user wants to edit the existing proposal
            prompt = `Here is the current proposal HTML:\n\n${currentHtml}\n\nUser instruction: ${refinementInstruction}\n\nApply the change and output the complete updated HTML only.`;
        } else {
            // This is a fresh generation request
            prompt = `Generate a complete proposal for this client:\n\n${JSON.stringify(proposalData, null, 2)}\n\nFollow the section order and rules exactly. Output HTML only.`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                systemInstruction: GENERATION_PROMPT,
                temperature: 0.3,
            },
        });

        let html = response.text;

        // Strip markdown code fences if AI wrapped the output
        html = html.replace(/^```html\n?/, "").replace(/\n?```$/, "").trim();
        html = html.replace(/^```\n?/, "").replace(/\n?```$/, "").trim();

        return res.status(200).json({ html });

    } catch (error) {
        console.error("Gemini generate error:", error);
        return res.status(500).json({ error: "Failed to generate proposal." });
    }
}