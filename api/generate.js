import { GoogleGenAI } from "@google/genai";

const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
].filter(Boolean);

function getAiClient(keyIndex = 0) {
    return new GoogleGenAI({ apiKey: API_KEYS[keyIndex % API_KEYS.length] });
}

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

const GENERATION_PROMPT = `You are a proposal writer for Atoms Digital Solutions.

Generate a complete professional proposal as a SINGLE clean HTML document.

CRITICAL OUTPUT RULES:
- Output RAW HTML only. Start with <!DOCTYPE html> or <html>.
- NO markdown. NO backticks. NO code fences. NO explanation text.
- NO text before or after the HTML. Just the HTML document.
- The HTML must be complete and self-contained with all styles inline.

SECTION ORDER (include all in this exact order):
1. Header — use FIXED text verbatim
2. Client Title Block — client name, city, package name, date
3. Understanding Your Requirement — 2-3 paragraphs, specific to client type/location/speciality
4. Objectives of Digital Marketing — use FIXED text verbatim
5. Recommended Service Scope — one sub-section per selected service only
6. Monthly Deliverables — only if social media selected, exact counts from JSON
7. Content Strategy — only if social media selected, tailored to speciality/hospital type
8. Add-Ons — only if add-ons selected, list them with prices
9. Pricing Table — show base, add-ons, subtotal, GST (18%), total. Use EXACT figures from JSON
10. Important Notes — use FIXED text verbatim
11. Why Atoms Digital Solutions — use FIXED text verbatim
12. Conclusion — 2-3 sentences personalised to client name
13. Footer — use FIXED text verbatim

FIXED SECTIONS (copy EXACTLY, word for word):

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

STYLING RULES:
- White background, dark text (#1a1a1a), font: Arial
- Page padding: 40px
- Company name in dark blue (#1e3a8a), bold, large
- Section headings in dark blue, uppercase, with bottom border
- Pricing in a clean table with borders
- Professional enough to send directly to a client
- Print-friendly (no backgrounds on sections)`;

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
            prompt = `Current proposal HTML:\n\n${currentHtml}\n\nInstruction: ${refinementInstruction}\n\nOutput the complete updated HTML only. No explanation, no markdown, just raw HTML starting with <!DOCTYPE html>.`;
        } else {
            prompt = `Generate a complete proposal for this client:\n\n${JSON.stringify(proposalData, null, 2)}\n\nOutput raw HTML only. Start with <!DOCTYPE html>. No markdown, no backticks, no explanation.`;
        }

        let response;
        let attempts = 0;
        const maxAttempts = API_KEYS.length * 2;

        while (attempts < maxAttempts) {
            try {
                const ai = getAiClient(attempts);
                response = await ai.models.generateContent({
                    model: "gemini-3.5-flash",
                    contents: prompt,
                    config: {
                        systemInstruction: GENERATION_PROMPT,
                        temperature: 0.2,
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

        let html = response.text;

        // Strip any markdown code fences if AI added them
        html = html.replace(/^```html\s*/i, "").replace(/\s*```$/i, "").trim();
        html = html.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

        // Strip any text before the HTML tag
        const htmlStart = html.indexOf("<!DOCTYPE") !== -1
            ? html.indexOf("<!DOCTYPE")
            : html.indexOf("<html");
        if (htmlStart > 0) {
            html = html.substring(htmlStart);
        }

        return res.status(200).json({ html });

    } catch (error) {
        console.error("Gemini generate error:", error);
        return res.status(500).json({ error: "Failed to generate proposal." });
    }
}