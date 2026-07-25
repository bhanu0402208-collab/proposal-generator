import { GoogleGenAI } from "@google/genai";

function getAiClient() {
    return new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });
}

const FIXED_OBJECTIVES = [
    "Build a strong and consistent digital presence",
    "Increase visibility and brand awareness among target patients",
    "Educate patients through valuable and relevant content",
    "Build trust and credibility through doctor-led content",
    "Drive appointment bookings and patient enquiries",
    "Improve Google search rankings and local discoverability",
    "Strengthen reputation through patient testimonials and reviews",
];

const FIXED_PROCESS = [
    "Requirement Discussion — Understanding your goals and target audience",
    "Strategy Planning — Content calendar, themes, and platform strategy",
    "Content Creation — Reels, posters, shoots as per agreed deliverables",
    "Client Approval — Review and approval before publishing",
    "Publishing — Scheduled posting across selected platforms",
    "Performance Review — Monthly insights and recommendations",
];

const FIXED_TIMELINE = [
    ["Week 1", "Content planning, strategy alignment, and approvals"],
    ["Week 2", "Content creation and video shoot (if applicable)"],
    ["Week 3", "Publishing, optimization, and community engagement"],
    ["Week 4", "Performance tracking, reporting, and next month planning"],
];

const FIXED_REPORTING = [
    "Reach and impressions across all platforms",
    "Engagement rate (likes, comments, shares, saves)",
    "Follower growth tracking",
    "Leads and enquiries generated",
    "Best-performing content analysis",
    "Strategic recommendations for the next month",
];

const FIXED_IMPORTANT_NOTES = [
    "Ad budget is separate from the management fee quoted above",
    "Results depend on consistency of content creation and posting",
    "Doctor/hospital participation improves content performance significantly",
    "4-day lead time required for additional design requests",
];

const FIXED_WHY_ATOMS = [
    "Specialized exclusively in healthcare digital marketing",
    "Deep understanding of patient psychology and medical content",
    "Proven track record with hospitals and clinics across Andhra Pradesh",
    "Dedicated content team with medical communication expertise",
    "Transparent reporting and consistent communication",
];

// ---------- AI PROMPTS (only for the small variable writing pieces) ----------

const CONTENT_WRITING_RULES = `WRITING RULES (apply to every field you write):
- Short, direct sentences. Maximum 2-3 sentences per paragraph.
- NEVER use these phrases: "We are confident", "We recognize the need", "dynamic and competitive", "This service focuses on", "position [client] as a trusted authority", "High-quality visual and video content is crucial"
- Be specific to the client's name, city, and speciality (if any). No generic filler.
- Plain text only. No HTML tags, no markdown, no asterisks.`;

function buildInitialContentPrompt(proposalData) {
    return `You are a proposal writer for Atoms Digital Solutions, a healthcare digital marketing agency in Andhra Pradesh, India.

Client details:
${JSON.stringify(proposalData, null, 2)}

${CONTENT_WRITING_RULES}

Output ONLY a JSON object (no markdown fences, no explanation) with exactly this shape:
{
  "understanding": ["paragraph 1", "paragraph 2"],
  "serviceScope": [
    { "name": "Service name", "whatWeDo": ["bullet", "bullet"], "expectedResults": ["bullet", "bullet"] }
  ],
  "contentStrategy": [
    { "title": "Theme name", "description": "one short sentence" }
  ],
  "conclusion": "1-2 sentences, personalised to the client name."
}

Rules for the fields:
- "understanding": exactly 2 short paragraphs about this specific client's requirement.
- "serviceScope": one entry for social media management (based on reels/posters/shoots), plus one entry per selected add-on that represents a distinct service (e.g. SEO, Ads, Website Management). Do not create entries for add-ons that are just extra units (Extra Reel, Extra Poster, Regular Shoot, Premium Shoot) — those belong in deliverables/pricing only, not service scope.
- "contentStrategy": 5-6 content theme categories relevant to this client's speciality/type. Only include this field if social media platforms were selected.
- "conclusion": personalised, no banned phrases.`;
}

function buildRefinementPrompt(proposalData, currentContent, instruction) {
    return `You are editing an existing proposal's written content for Atoms Digital Solutions.

Client details:
${JSON.stringify(proposalData, null, 2)}

Current content JSON:
${JSON.stringify(currentContent, null, 2)}

Requested change:
"${instruction}"

${CONTENT_WRITING_RULES}

CRITICAL: Output the COMPLETE content JSON back, in the exact same shape as the input.
- Change ONLY what the requested change asks for.
- Every field/value NOT related to the request must be copied back EXACTLY character-for-character as given — do not reword, shorten, rephrase, or "improve" anything you were not asked to change.
- Do not remove or add fields that weren't part of the request.
- Output ONLY the JSON object, no markdown fences, no explanation.`;
}

// ---------- Helpers ----------

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatRupees(amount) {
    const n = Number(amount) || 0;
    return "₹" + n.toLocaleString("en-IN");
}

async function retryingCall(fn) {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
        try {
            return await fn();
        } catch (err) {
            attempts++;
            if ((err.status === 429 || err.status === 503) && attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } else {
                throw err;
            }
        }
    }
}

function callGemini(systemInstruction, userPrompt) {
    return retryingCall(async () => {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction,
                maxOutputTokens: 8192,
            },
        });
        return response.text;
    });
}

function parseJsonFromModel(text) {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}") + 1;
    if (start === -1 || end <= start) {
        throw new Error("Model did not return valid JSON content.");
    }
    return JSON.parse(cleaned.substring(start, end));
}

// ---------- HTML rendering (pure code, no AI — always exact) ----------

function renderList(items) {
    return `<ul style="margin:0 0 12px 0;padding-left:20px;">${items
        .map((item) => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`)
        .join("")}</ul>`;
}

function sectionHeading(title) {
    return `<h2 style="color:#1e3a8a;text-transform:uppercase;letter-spacing:1px;font-size:14px;font-weight:bold;border-bottom:2px solid #1e3a8a;padding-bottom:6px;margin-top:32px;">${escapeHtml(title)}</h2>`;
}

function renderTable(headers, rows) {
    const thead = `<tr>${headers.map((h) => `<th style="background:#1e3a8a;color:#fff;padding:10px;text-align:left;border:1px solid #e5e7eb;">${escapeHtml(h)}</th>`).join("")}</tr>`;
    const tbody = rows
        .map(
            (row, i) =>
                `<tr style="background:${i % 2 === 1 ? "#f8fafc" : "#ffffff"};">${row
                    .map((cell) => `<td style="padding:10px;border:1px solid #e5e7eb;">${cell}</td>`)
                    .join("")}</tr>`
        )
        .join("");
    return `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${thead}${tbody}</table>`;
}

function buildProposalHtml(proposalData, content) {
    const {
        clientName, city, speciality, packageName,
        reels, posters, shoots, platforms,
        addOns = [], basePrice, subtotal, gst, totalPrice,
    } = proposalData;

    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const platformList = (platforms || []).join(", ");

    let html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Digital Marketing Proposal - ${escapeHtml(clientName)}</title></head>
<body style="background:#ffffff;color:#1a1a1a;font-family:Arial,sans-serif;line-height:1.6;padding:40px;max-width:800px;margin:auto;">

<div style="color:#1e3a8a;font-weight:bold;font-size:22px;">Atoms Digital Solutions Private Limited</div>
<div>CIN: U74999AP2022PTC133342</div>
<div>Email: atomsdigitalsolutions@gmail.com | Phone: +91 98765 43210</div>
<div style="font-weight:bold;margin-top:8px;">DIGITAL MARKETING PROPOSAL</div>

<h1 style="margin-top:24px;">${escapeHtml(clientName)}, ${escapeHtml(city)}</h1>
<div>Package: ${escapeHtml(packageName)}${speciality ? " | Speciality: " + escapeHtml(speciality) : ""}</div>
<div>Date: ${today}</div>

${sectionHeading("Understanding Your Requirement")}
${(content.understanding || []).map((p) => `<p style="margin-bottom:12px;">${escapeHtml(p)}</p>`).join("")}

${sectionHeading("Objectives of Digital Marketing")}
${renderList(FIXED_OBJECTIVES)}

${sectionHeading("Recommended Service Scope")}
${(content.serviceScope || [])
            .map(
                (svc) => `
<h3 style="margin-top:16px;margin-bottom:4px;">${escapeHtml(svc.name)}</h3>
<div style="font-weight:bold;margin-top:8px;">What We Do:</div>
${renderList(svc.whatWeDo || [])}
<div style="font-weight:bold;">Expected Results:</div>
${renderList(svc.expectedResults || [])}
`
            )
            .join("")}

${sectionHeading("Monthly Deliverables")}
${renderTable(
                ["Deliverable", "Quantity", "Platform"],
                [
                    ["Reels", String(reels), platformList],
                    ["Posters", String(posters), platformList],
                    ...(shoots > 0 ? [["Video Shoots", String(shoots), "On-site (Content for " + platformList + ")"]] : []),
                ]
            )}

${content.contentStrategy && content.contentStrategy.length > 0
            ? `${sectionHeading("Content Strategy")}
${renderList(content.contentStrategy.map((c) => `${c.title}: ${c.description}`))}`
            : ""
        }

${sectionHeading("Our Process")}
<ol style="margin:0 0 12px 0;padding-left:20px;">${FIXED_PROCESS.map((p) => `<li style="margin-bottom:6px;">${escapeHtml(p)}</li>`).join("")}</ol>

${sectionHeading("Project Timeline")}
${renderTable(["Week", "Focus"], FIXED_TIMELINE.map(([w, d]) => [escapeHtml(w), escapeHtml(d)]))}

${addOns.length > 0
            ? `${sectionHeading("Add-Ons")}
${renderTable(["Name", "Price"], addOns.map((a) => [escapeHtml(a.name), formatRupees(a.price)]))}`
            : ""
        }

${sectionHeading("Pricing Table")}
${renderTable(
            ["Item", "Price"],
            [
                [`Base Package (${escapeHtml(packageName)})`, formatRupees(basePrice)],
                ...addOns.map((a) => [`Add-On: ${escapeHtml(a.name)}`, formatRupees(a.price)]),
                ["Subtotal", formatRupees(subtotal)],
                ["GST (18%)", formatRupees(gst)],
                ["<strong>Total Price</strong>", `<strong>${formatRupees(totalPrice)}</strong>`],
            ]
        )}

${sectionHeading("Reporting & Analytics")}
<p>Monthly performance reports will include:</p>
${renderList(FIXED_REPORTING)}

${sectionHeading("Important Notes")}
${renderList(FIXED_IMPORTANT_NOTES)}

${sectionHeading("Why Atoms Digital Solutions?")}
${renderList(FIXED_WHY_ATOMS)}

${sectionHeading("Conclusion")}
<p>${escapeHtml(content.conclusion || "")}</p>

<div style="margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;font-size:13px;color:#555;">
Atoms Digital Solutions Private Limited<br/>
Flat No. 301, Sri Siva Sankari Nilayam, Gorantla, Guntur - 522034, Andhra Pradesh<br/>
atomsdigitalsolutions@gmail.com | +91 98765 43210
</div>

</body>
</html>`;

    return html;
}

// ---------- Handler ----------

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { proposalData, refinementInstruction, currentContent } = req.body;

    if (!proposalData && !refinementInstruction) {
        return res.status(400).json({ error: "proposalData or refinementInstruction required." });
    }

    try {
        let content;

        if (refinementInstruction && currentContent) {
            // Targeted edit: send only the small content JSON, not the full HTML.
            const prompt = buildRefinementPrompt(proposalData, currentContent, refinementInstruction);
            const raw = await callGemini("You edit proposal content JSON precisely and conservatively.", prompt);
            content = parseJsonFromModel(raw);
        } else {
            const prompt = buildInitialContentPrompt(proposalData);
            const raw = await callGemini("You write healthcare marketing proposal content as JSON.", prompt);
            content = parseJsonFromModel(raw);
        }

        const html = buildProposalHtml(proposalData, content);

        return res.status(200).json({ html, content });

    } catch (error) {
        console.error("Generate proposal error:", error);
        return res.status(500).json({ error: error.message || "Failed to generate proposal." });
    }
}