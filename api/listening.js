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

    const { theme } = req.body || {};

    try {
        const prompt = `You are an expert English listening test creator. Generate a brand new, unique English listening practice exercise tailored to this theme: "${theme || 'General Knowledge'}". 
        Return strictly in valid JSON format using this exact structure without any additional text or markdown:
        {
          "audioText": "A short and natural English listening passage or conversation (3-4 sentences long) related to the theme.",
          "question": "A clear reading comprehension question in English based on the passage?",
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
            throw new Error(errData.error?.message || "Gagal dari Google API");
        }

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;

        // Pembersihan string secara total dari markdown code block
        rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        
        // Ambil bagian yang benar-benar berupa objek JSON jika ada teks tambahan di luar kurung kurawal
        const firstOpen = rawText.indexOf('{');
        const lastClose = rawText.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            rawText = rawText.substring(firstOpen, lastClose + 1);
        }

        const listeningData = JSON.parse(rawText);
        return res.status(200).json(listeningData);

    } catch (err) {
        console.error("Error di API Listening:", err);
        return res.status(500).json({ error: err.message });
    }
}
