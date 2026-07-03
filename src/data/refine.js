import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const REFINE_PROMPT = `You are a proposal editor for Atoms Digital Solutions.
You will be provided with the current HTML of a proposal and an instruction from the user on what to change.
Apply the requested changes to the HTML.
CRITICAL RULES:
1. OUTPUT HTML ONLY. Do not use Markdown backticks (\`\`\`html). Output the raw HTML string.
2. ONLY make the changes requested. Do not rewrite other sections.
3. Keep the overall structure and styling the same.
4. If they ask to remove a section, remove that entire section's heading and content.
5. If they ask to change a price, update the text where the price appears.
`;
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    const { instruction, currentHtml } = req.body;
    if (!instruction || !currentHtml) {
        return res.status(400).json({ error: "Instruction and currentHtml are required." });
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `CURRENT HTML:\n${currentHtml}\n\nUSER INSTRUCTION:\n${instruction}\n\nPlease output the complete updated HTML.`,
            config: {
                systemInstruction: REFINE_PROMPT,
                temperature: 0.2
            },
        });
        let html = response.text;

        // Clean up markdown if the AI wrapped it
        if (html.startsWith("```html")) {
            html = html.substring(7);
            if (html.endsWith("```")) {
                html = html.substring(0, html.length - 3);
            }
        } else if (html.startsWith("```")) {
            html = html.substring(3);
            if (html.endsWith("```")) {
                html = html.substring(0, html.length - 3);
            }
        }
        return res.status(200).json({ html: html.trim() });
    } catch (error) {
        console.error("Gemini API error:", error);
        return res.status(500).json({ error: "Failed to refine proposal." });
    }
}
