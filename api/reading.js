export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode tidak diizinkan.' });
    }

    // 1. ROTASI MULTI-KEY SECARA ACAK
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ 
            error: "API Keys tidak ditemukan di backend /api/reading." 
        });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

    // Tangkap tema yang dikirim dari frontend reading.js
    const { theme } = req.body;

    try {
        const prompt = `You are an expert English reading comprehension test creator. Generate an English reading exercise tailored to this theme: "${theme || 'General Knowledge'}". 
        The passage must be informative, written in clear English (intermediate B1 level), around 2 to 3 paragraphs long.
        The output MUST be in strict JSON format without any markdown wrappers, using this exact structure:
        {
          "title": "A catchy title in English",
          "passage": "The main reading article text in English...",
          "questions": [
            {
              "question": "Reading comprehension question 1 based on the passage?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "The exact matching text of the correct option",
              "explanation": "Brief explanation in Bahasa Indonesia why this answer is correct."
            },
            {
              "question": "Reading comprehension question 2 based on the passage?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "The exact matching text of the correct option",
              "explanation": "Brief explanation in Bahasa Indonesia why this answer is correct."
            }
          ]
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

        // Pembersihan aman dari markdown code blocks
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        const readingData = JSON.parse(rawText);
        return res.status(200).json(readingData);

    } catch (err) {
        console.error("Error di API Reading:", err);
        return res.status(500).json({ error: `Gagal memproses sesi reading: ${err.message}` });
    }
}
