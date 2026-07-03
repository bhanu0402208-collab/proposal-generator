import HTMLtoDOCX from 'html-to-docx';
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    const { html, filename } = req.body;
    if (!html) {
        return res.status(400).json({ error: "HTML content is required." });
    }
    try {
        // Pre-process HTML to ensure it converts cleanly
        const cleanHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"></head>
            <body>
                ${html}
            </body>
            </html>
        `;
        const fileBuffer = await HTMLtoDOCX(cleanHtml, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'Proposal.docx'}"`);

        return res.send(fileBuffer);
    } catch (error) {
        console.error("Export error:", error);
        return res.status(500).json({ error: "Failed to create document." });
    }
}
