export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ error: "API Keys tidak ditemukan." });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

    const { theme } = req.body;

    try {
        const prompt = `You are an expert English reading comprehension and vocabulary test creator. Generate an English reading exercise tailored to this theme: "${theme || 'General Knowledge'}". 
        The output MUST be in strict JSON format without any markdown wrappers, using this exact structure:
        {
          "paragraph1": "First paragraph of the reading article in English...",
          "paragraph2": "Second paragraph of the reading article in English...",
          "paragraph3": "Third paragraph of the reading article in English...",
          "vocabularyMap": {
            "keyWord1": "arti kata 1 dalam Bahasa Indonesia",
            "keyWord2": "arti kata 2 dalam Bahasa Indonesia"
          },
          "question": "Reading comprehension question in English based on the article above?",
          "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
          "answer": "The exact matching text of the correct option",
          "explanation": "Brief explanation in Bahasa Indonesia why this answer is correct."
        }`;

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Gagal merespon dari Google API");
        }

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        return res.status(200).json(JSON.parse(rawText));

    } catch (err) {
        console.error("Error di API Reading:", err);
        return res.status(500).json({ error: `Gagal memproses sesi reading: ${err.message}` });
    }
}
