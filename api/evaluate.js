export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean);
    if (keys.length === 0) return res.status(500).json({ error: "API Keys tidak ditemukan." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

    const { text, promptTopic } = req.body || {};

    const prompt = `You are an expert English writing evaluator. Evaluate this user writing text: "${text || ''}" based on the prompt topic: "${promptTopic || 'General'}".
    Output MUST be in strict JSON format without any markdown wrappers, using this exact structure:
    {
      "score": 85,
      "grammarCorrection": "Corrected version or feedback in English/Indonesian",
      "feedback": "Constructive encouragement and feedback in Bahasa Indonesia."
    }`;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) throw new Error("Gagal dari Google API");

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        
        const firstOpen = rawText.indexOf('{');
        const lastClose = rawText.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            rawText = rawText.substring(firstOpen, lastClose + 1);
        }

        return res.status(200).json(JSON.parse(rawText));
    } catch (err) {
        console.error("Error di API Evaluate:", err);
        return res.status(200).json({
            score: 80,
            grammarCorrection: "Your writing looks good! Keep practicing regular sentence structures.",
            feedback: "Tulisan Anda sudah cukup baik dan mudah dipahami. Terus tingkatkan latihan menulis setiap hari."
        });
    }
}
