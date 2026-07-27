import { GoogleGenAI } from "@google/genai";

function getAiClient() {
    return new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });
}

const FIXED_OBJECTIVES = [
    "Increase Brand Awareness in the Local Community",
    "Generate Qualified Patient Leads and Enquiries",
    "Improve Local Search Visibility on Google",
    "Build Trust Through Educational Healthcare Content",
    "Increase Appointment Bookings",
    "Strengthen Online Reputation and Reviews",
    "Improve Patient Engagement Across Social Media",
];

const WHY_PATIENTS_ONLINE = "Today's patients research online before making healthcare decisions. They evaluate hospitals and doctors based on reviews, ratings, doctor expertise, social media presence, and patient success stories. A strong, consistent digital presence directly shapes patient trust and influences appointment decisions.";

const FIXED_PROCESS = [
    "Discovery",
    "Strategy Development",
    "Monthly Content Planning",
    "Creative Production",
    "Review & Approval",
    "Publishing & Promotion",
    "Monitoring & Optimization",
    "Monthly Performance Review",
];

const FIXED_TIMELINE = [
    { week: "Week 1", items: ["Brand Audit", "Competitor Analysis", "Content Calendar"] },
    { week: "Week 2", items: ["Shoot", "Design", "Editing"] },
    { week: "Week 3", items: ["Publishing", "Community Engagement", "Ads Optimization"] },
    { week: "Week 4", items: ["Analytics", "Report", "Strategy Review"] },
];

const FIXED_REPORTING = [
    "Reach and impressions across all platforms",
    "Engagement rate (likes, comments, shares, saves)",
    "Follower growth tracking",
    "Profile visits and website clicks",
    "WhatsApp clicks and appointment enquiries",
    "Cost per lead (for ad campaigns)",
    "Top-performing content each month",
    "Audience demographics",
    "Campaign ROI (for ad campaigns)",
    "Strategic recommendations for the next month",
];

const FIXED_IMPORTANT_NOTES = [
    "Ad budget is separate from the management fee quoted above",
    "One round of revisions is included per creative",
    "Hospital/doctor to provide timely approvals within 48 hours",
    "Emergency creatives are subject to team availability",
    "Additional shoots beyond the agreed scope are quoted separately",
    "Deliverables begin after onboarding is completed",
    "Results depend on consistency of content creation, posting, and doctor/hospital participation",
    "4-day lead time required for additional design requests",
];

const FIXED_WHY_ATOMS = [
    "Dedicated Healthcare Marketing Team",
    "Patient-Centric Marketing Strategy",
    "Data-Driven Decision Making",
    "Creative Video Production In-House",
    "Transparent Monthly Reporting",
    "Proven Track Record Across Andhra Pradesh",
    "Faster Turnaround Time",
    "Deep Understanding of Patient Psychology",
];

const FIXED_KPI_TABLE = [
    ["Social Reach", "Increase Monthly"],
    ["Engagement Rate", "Improve Consistently"],
    ["Leads Generated", "Growth Month-on-Month"],
    ["Appointment Enquiries", "Increase"],
    ["Google Local Visibility", "Improve"],
    ["Brand Awareness", "Strengthen"],
];

const FIXED_CLIENT_RESPONSIBILITIES = [
    "Provide branding assets (logo, photos, brand guidelines)",
    "Coordinate doctor/staff availability for shoots and interviews",
    "Approve creatives within 48 hours of sharing",
    "Share information required for campaigns and content",
    "Provide access to relevant social media accounts",
];

const STANDARD_DELIVERABLE_EXTRAS = [
    ["Stories", "20"],
    ["Caption Writing", "Included"],
    ["Hashtag Research", "Included"],
    ["Monthly Content Calendar", "1"],
    ["Community Management", "Included"],
    ["Performance Report", "1"],
];

// ---------- AI PROMPTS (only for the small variable writing pieces) ----------

const CONTENT_WRITING_RULES = `WRITING RULES (apply to every field you write):
- Write like an experienced healthcare marketing consultant, not a template. Premium, confident, consultative tone — this should read like a proposal worth the client's investment, not generic filler.
- Short, direct paragraphs (2-3 sentences).
- NEVER use these phrases: "We are confident", "We recognize the need", "dynamic and competitive", "This service focuses on", "position [client] as a trusted authority", "High-quality visual and video content is crucial"
- CRITICAL - AVOID REPETITION: core ideas like "increase visibility", "build trust", "patient engagement", and "online presence" must each appear ONLY ONCE across the entire content, in whichever field they matter most. Do not restate the same concept in multiple fields using different words.
- Be specific to the client's name, city, and speciality (if any). No generic filler.
- Plain text only. No HTML tags, no markdown, no asterisks.`;

function buildInitialContentPrompt(proposalData) {
    return `You are a senior proposal writer for Atoms Digital Solutions, a healthcare digital marketing agency in Andhra Pradesh, India.

Client details:
${JSON.stringify(proposalData, null, 2)}

${CONTENT_WRITING_RULES}

Output ONLY a JSON object (no markdown fences, no explanation) with exactly this shape:
{
  "understanding": ["paragraph 1", "paragraph 2"],
  "serviceScope": [
    { "name": "Service name", "scopeOfWork": ["bullet", "bullet"], "deliverables": ["bullet", "bullet"], "resultsHeading": "Benefits or Campaign Objectives", "results": ["bullet", "bullet"] }
  ],
  "contentStrategy": [
    { "title": "Theme name", "description": "one short sentence" }
  ],
  "conclusion": "2-3 sentences, personalised to the client name, emotionally resonant about patient trust and measurable growth — not just 'we look forward to working with you'."
}

Rules for the fields:
- "understanding": exactly 2 short paragraphs. Paragraph 1: establish the client's current standing and why digital presence matters now for patient acquisition. Paragraph 2: position Atoms' strategy specifically for this client (educational content, community engagement, patient enquiries, reputation).
- "serviceScope": one entry for social media management (based on reels/posters/shoots), plus one entry per selected add-on that represents a distinct service (SEO, Ads, Website Management). Do not create entries for add-ons that are just extra units (Extra Reel, Extra Poster, Regular Shoot, Premium Shoot). For each entry: "scopeOfWork" = internal activities (content calendar, hashtag research, community management, etc.), "deliverables" = concrete monthly output, "resultsHeading" = "Campaign Objectives" for any ads-related service, otherwise "Benefits", "results" = 3-4 bullets matching that heading.
- "contentStrategy": 7-8 varied content theme categories (e.g. health tips, doctor spotlight, patient stories, facility tours, preventive care, FAQs, myth vs fact, seasonal awareness, doctor interviews, behind the scenes) relevant to this client's speciality/type. Only include this field if social media platforms were selected.
- "conclusion": personalised, impactful, no banned phrases, no repeated ideas from earlier fields.`;
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

function renderCheckList(items) {
    return `<ul style="list-style:none;margin:0 0 12px 0;padding:0;">${items
        .map((item) => `<li style="margin-bottom:8px;">✔ ${escapeHtml(item)}</li>`)
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

function renderProcessFlow(steps) {
    return `<div style="margin-bottom:16px;">${steps
        .map(
            (step, i) =>
                `<div style="padding:10px 16px;background:#f8fafc;border-left:3px solid #1e3a8a;margin-bottom:${i < steps.length - 1 ? "4px" : "0"};font-weight:600;">${escapeHtml(step)}</div>${i < steps.length - 1 ? `<div style="text-align:center;color:#1e3a8a;font-weight:bold;margin:2px 0;">↓</div>` : ""
                }`
        )
        .join("")}</div>`;
}

function renderTimeline(timeline) {
    return timeline
        .map(
            (wk) => `
<h3 style="margin-top:14px;margin-bottom:4px;color:#1e3a8a;">${escapeHtml(wk.week)}</h3>
${renderList(wk.items)}`
        )
        .join("");
}

function buildProposalHtml(proposalData, content) {
    const {
        clientName, city, speciality, packageName,
        reels, posters, shoots, platforms,
        addOns = [], basePrice, subtotal, gst, totalPrice,
    } = proposalData;

    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const platformList = (platforms || []).join(", ");
    const hasSocial = (reels > 0 || posters > 0);

    const deliverableRows = [
        ["Reels", String(reels), platformList],
        ["Posters", String(posters), platformList],
        ...(shoots > 0 ? [["Professional Shoot", String(shoots), "On-site (Content for " + platformList + ")"]] : []),
        ...(hasSocial ? STANDARD_DELIVERABLE_EXTRAS.map(([name, qty]) => [name, qty, platformList]) : []),
    ];

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

${sectionHeading("Why Patients Choose Hospitals Online")}
<p style="margin-bottom:12px;">${escapeHtml(WHY_PATIENTS_ONLINE)}</p>

${sectionHeading("Recommended Service Scope")}
${(content.serviceScope || [])
            .map(
                (svc) => `
<h3 style="margin-top:16px;margin-bottom:4px;">${escapeHtml(svc.name)}</h3>
<div style="font-weight:bold;margin-top:8px;">Scope of Work:</div>
${renderList(svc.scopeOfWork || [])}
<div style="font-weight:bold;">Deliverables:</div>
${renderList(svc.deliverables || [])}
<div style="font-weight:bold;">${escapeHtml(svc.resultsHeading || "Benefits")}:</div>
${renderList(svc.results || [])}
`
            )
            .join("")}

${sectionHeading("Monthly Deliverables")}
${renderTable(["Deliverable", "Quantity", "Platform"], deliverableRows)}

${content.contentStrategy && content.contentStrategy.length > 0
            ? `${sectionHeading("Content Strategy")}
${renderList(content.contentStrategy.map((c) => `${c.title}: ${c.description}`))}`
            : ""
        }

${sectionHeading("Our Process")}
${renderProcessFlow(FIXED_PROCESS)}

${sectionHeading("Project Timeline")}
${renderTimeline(FIXED_TIMELINE)}

${addOns.length > 0
            ? `${sectionHeading("Add-Ons")}
${renderTable(["Name", "Investment"], addOns.map((a) => [escapeHtml(a.name), formatRupees(a.price)]))}`
            : ""
        }

${sectionHeading("Pricing Table")}
${renderTable(
            ["Item", "Investment"],
            [
                [`Base Package (${escapeHtml(packageName)})`, formatRupees(basePrice)],
                ...addOns.map((a) => [`Add-On: ${escapeHtml(a.name)}`, formatRupees(a.price)]),
                ["Subtotal", formatRupees(subtotal)],
                ["GST (18%)", formatRupees(gst)],
                ["<strong>Total Investment</strong>", `<strong>${formatRupees(totalPrice)}</strong>`],
            ]
        )}

${sectionHeading("Success Metrics (KPIs)")}
${renderTable(["KPI", "Goal"], FIXED_KPI_TABLE)}

${sectionHeading("Client Responsibilities")}
${renderList(FIXED_CLIENT_RESPONSIBILITIES)}

${sectionHeading("Reporting & Analytics")}
<p>Monthly performance reports will include:</p>
${renderList(FIXED_REPORTING)}

${sectionHeading("Important Notes")}
${renderList(FIXED_IMPORTANT_NOTES)}

${sectionHeading("Why Partner With Atoms Digital Solutions")}
${renderCheckList(FIXED_WHY_ATOMS)}

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
            const prompt = buildRefinementPrompt(proposalData, currentContent, refinementInstruction);
            const raw = await callGemini("You edit proposal content JSON precisely and conservatively.", prompt);
            content = parseJsonFromModel(raw);
        } else {
            const prompt = buildInitialContentPrompt(proposalData);
            const raw = await callGemini("You write premium healthcare marketing proposal content as JSON.", prompt);
            content = parseJsonFromModel(raw);
        }

        const html = buildProposalHtml(proposalData, content);

        return res.status(200).json({ html, content });

    } catch (error) {
        console.error("Generate proposal error:", error);
        return res.status(500).json({ error: error.message || "Failed to generate proposal." });
    }
}