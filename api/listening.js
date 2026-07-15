export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean);
    if (keys.length === 0) return res.status(500).json({ error: "API Keys tidak ditemukan." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const { level } = req.body;

    const prompt = `Generate a listening exercise for English level ${level || 'B1'}. 
    The output MUST be in strict JSON format without any markdown wrappers using this exact structure:
    {
      "audioText": "A clear, natural paragraph in English (4-5 sentences) to be read out loud.",
      "question": "A comprehension question about the text in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The exact matching text of the correct option",
      "explanation": "Brief explanation in Bahasa Indonesia."
    }`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${activeKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            const errJson = await response.json();
            throw new Error(errJson.error?.message || "Gagal dari Google API");
        }

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        return res.status(200).json(JSON.parse(rawText));
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
