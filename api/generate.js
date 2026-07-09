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

const FIXED_PROCESS = `OUR PROCESS
1. Requirement Discussion — Understanding your goals and target audience
2. Strategy Planning — Content calendar, themes, and platform strategy
3. Content Creation — Reels, posters, shoots as per agreed deliverables
4. Client Approval — Review and approval before publishing
5. Publishing — Scheduled posting across selected platforms
6. Performance Review — Monthly insights and recommendations`;

const FIXED_TIMELINE = `PROJECT TIMELINE
Week 1: Content planning, strategy alignment, and approvals
Week 2: Content creation and video shoot (if applicable)
Week 3: Publishing, optimization, and community engagement
Week 4: Performance tracking, reporting, and next month planning`;

const FIXED_REPORTING = `REPORTING & ANALYTICS
Monthly performance reports will include:
- Reach and impressions across all platforms
- Engagement rate (likes, comments, shares, saves)
- Follower growth tracking
- Leads and enquiries generated
- Best-performing content analysis
- Strategic recommendations for the next month`;

const GENERATION_PROMPT = `You are a proposal writer for Atoms Digital Solutions, a healthcare digital marketing agency.

Generate a complete professional proposal as a single clean HTML document.

CRITICAL OUTPUT RULES:
- Output RAW HTML only. Start with <!DOCTYPE html>.
- NO markdown. NO backticks. NO code fences. NO explanation text before or after.
- All styles must be inline. The document must be self-contained.

WRITING RULES:
- Use SHORT paragraphs — maximum 2-3 sentences each.
- Use bullet points wherever possible instead of long paragraphs.
- NEVER use these phrases: "We are confident", "We recognize the need", "dynamic and competitive", "This service focuses on", "position [client] as a trusted authority", "High-quality visual and video content is crucial"
- Be direct and specific. Tell the client what you will deliver, not why content matters.
- Keep the Overview section to 2 short paragraphs maximum.

SECTION ORDER (include ALL in this exact order):
1. Header — FIXED text verbatim
2. Client Title Block — client name, city, package name, and today's date which is ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
3. Understanding Your Requirement — 2 SHORT paragraphs specific to client/location/speciality. No generic statements.
4. Objectives of Digital Marketing — FIXED text verbatim
5. Recommended Service Scope — one sub-section per selected service. Use bullet points for "What We Do" and "Expected Results". No long paragraphs.
6. Monthly Deliverables Table — only if social media selected. Show as an HTML table with columns: Deliverable, Quantity, Platform.
7. Content Strategy — only if social media selected. Use bullet points for content theme categories tailored to speciality/hospital type.
8. Our Process — FIXED text verbatim
9. Project Timeline — FIXED text verbatim
10. Add-Ons — only if add-ons selected. List as a table with Name and Price columns.
11. Pricing Table — HTML table showing: Base Package, each Add-On, Subtotal, GST (18%), Total. Use EXACT figures from JSON.
12. Reporting & Analytics — FIXED text verbatim
13. Important Notes — FIXED text verbatim
14. Why Atoms Digital Solutions — FIXED text verbatim
15. Conclusion — 2 sentences maximum, personalised to client name. No "We are confident" phrases.
16. Footer — FIXED text verbatim

FIXED SECTIONS (copy EXACTLY, word for word, no changes):

HEADER:
${FIXED_HEADER}

OBJECTIVES:
${FIXED_OBJECTIVES}

OUR PROCESS:
${FIXED_PROCESS}

PROJECT TIMELINE:
${FIXED_TIMELINE}

REPORTING:
${FIXED_REPORTING}

IMPORTANT NOTES:
${FIXED_IMPORTANT_NOTES}

WHY ATOMS:
${FIXED_WHY_ATOMS}

FOOTER:
${FIXED_FOOTER}

STYLING RULES:
- White background (#ffffff), dark text (#1a1a1a), font: Arial, line-height: 1.6
- Page padding: 40px, max-width: 800px, margin: auto
- Company name: dark blue (#1e3a8a), bold, 22px
- Section headings: dark blue (#1e3a8a), uppercase, letter-spacing: 1px (NOT more), font-size: 14px, font-weight: bold, border-bottom: 2px solid #1e3a8a, padding-bottom: 6px, margin-top: 32px
- Pricing numbers: always format with Indian Rupee symbol ₹ and comma separators (e.g. ₹60,000 not 60000)
- Tables: full width, border-collapse collapse, 1px solid #e5e7eb borders, 10px cell padding
- Table headers: background #1e3a8a, white text
- Alternating table rows: #f8fafc for even rows
- Print-friendly: no colored backgrounds on sections`;

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
            prompt = `Current proposal HTML:\n\n${currentHtml}\n\nInstruction: ${refinementInstruction}\n\nApply the change precisely. Output the complete updated HTML only. Start with <!DOCTYPE html>. No markdown, no explanation.`;
        } else {
            prompt = `Generate a complete proposal for this client:\n\n${JSON.stringify(proposalData, null, 2)}\n\nOutput raw HTML only. Start with <!DOCTYPE html>. No markdown, no backticks, no explanation text before or after the HTML.`;
        }

        let response;
        let attempts = 0;
        const maxAttempts = API_KEYS.length * 2;

        while (attempts < maxAttempts) {
            try {
                const ai = getAiClient(attempts);
                response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        systemInstruction: GENERATION_PROMPT,
                        temperature: 0.2,
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

        let html = response.text;

        // Strip any markdown code fences
        html = html.replace(/^```html\s*/i, "").replace(/\s*```$/i, "").trim();
        html = html.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

        // Strip any text before the HTML doctype
        const htmlStart = html.indexOf("<!DOCTYPE") !== -1
            ? html.indexOf("<!DOCTYPE")
            : html.indexOf("<html");
        if (htmlStart > 0) {
            html = html.substring(htmlStart);
        }

        return res.status(200).json({ html });

    } catch (error) {
        console.error("Gemini generate error:", error);
        return res.status(500).json({ error: error.message || "Failed to generate proposal." });
    }
}