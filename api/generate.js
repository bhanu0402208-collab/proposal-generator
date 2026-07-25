import { GoogleGenAI } from "@google/genai";

function getAiClient() {
    return new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { apiVersion: 'v1' }
    });
}

const GENERATION_PROMPT = `You are a proposal writer for Atoms Digital Solutions, a healthcare digital marketing agency.

Your task is to generate the custom creative text for a digital marketing proposal, outputting ONLY a strict JSON object.

CRITICAL RULES:
- Output ONLY valid JSON.
- Be direct and specific. No generic fluff.
- Use SHORT paragraphs (1-2 sentences).
- NEVER use phrases like: "We are confident", "We recognize the need", "dynamic and competitive".
- The JSON must match the exact structure below.

JSON SCHEMA:
{
  "understandingRequirement": "2 short paragraphs specific to the client's city, name, and speciality. Tell them exactly what we will do, not why content matters.",
  "serviceScope": [
    {
      "serviceName": "Name of the service",
      "whatWeDo": ["Bullet point 1", "Bullet point 2"],
      "expectedResults": ["Result 1", "Result 2"]
    }
  ],
  "contentStrategy": [
    "Content theme/category 1 tailored to the client",
    "Content theme/category 2 tailored to the client"
  ],
  "conclusion": "2 sentences maximum, personalised to the client. No 'We are confident' phrases."
}`;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { proposalData, refinementInstruction, currentProposalJson } = req.body;

    if (!proposalData && !refinementInstruction) {
        return res.status(400).json({ error: "proposalData or refinementInstruction required." });
    }

    try {
        let prompt;

        if (refinementInstruction && currentProposalJson) {
            prompt = `Current Proposal JSON:\n${JSON.stringify(currentProposalJson, null, 2)}\n\nUser Instruction: ${refinementInstruction}\n\nUpdate ONLY the parts of the JSON requested. Do not change anything else. Return the complete updated JSON object.`;
        } else {
            prompt = `Generate the proposal JSON for this client data:\n${JSON.stringify(proposalData, null, 2)}`;
        }

        const contents = [
            {
                role: "user",
                parts: [{ text: `SYSTEM INSTRUCTIONS:\n${GENERATION_PROMPT}\n\n${prompt}` }]
            }
        ];

        let response;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const ai = getAiClient();
                response = await ai.models.generateContent({
                    model: "gemini-1.5-flash",
                    contents: contents,
                    config: {
                        responseMimeType: "application/json"
                    }
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

        let jsonText = response.text;
        
        let parsed = null;
        try {
            parsed = JSON.parse(jsonText);
        } catch (e) {
            // Strip markdown just in case gemini ignores responseMimeType
            let cleaned = jsonText.trim();
            cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
            cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
            parsed = JSON.parse(cleaned);
        }

        return res.status(200).json({ proposalJson: parsed });

    } catch (error) {
        console.error("Gemini generate error:", error);
        return res.status(500).json({ error: "Failed to generate proposal." });
    }
}