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
            error: "API Keys tidak ditemukan di backend /api/daily." 
        });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

    const { action, type, currentMaterial } = req.body;

    try {
        let prompt = "";

        if (action === 'get-material-bulk') {
            if (type === 'vocab') {
                prompt = `Generate a JSON array containing 10 diverse daily vocabulary themes for English learners. 
                Each item must follow this exact structure:
                {
                  "theme": "Theme title in English (e.g., At the Airport, Business Meeting)",
                  "words": [
                    {"word": "English word 1", "meaning": "Arti dalam Bahasa Indonesia", "example": "Example sentence in English."},
                    {"word": "English word 2", "meaning": "Arti dalam Bahasa Indonesia", "example": "Example sentence in English."},
                    {"word": "English word 3", "meaning": "Arti dalam Bahasa Indonesia", "example": "Example sentence in English."}
                  ]
                }
                Output MUST be a valid JSON array of objects without any markdown wrappers.`;
            } else {
                prompt = `Generate a JSON array containing 10 essential English grammar masterclass topics. 
                Each item must follow this exact structure:
                {
                  "topic": "Grammar topic name (e.g., Past Perfect Tense)",
                  "explanation": "Clear explanation of when to use it in Bahasa Indonesia",
                  "formula": "Subject + had + Verb 3..."
                }
                Output MUST be a valid JSON array of objects without any markdown wrappers.`;
            }
        } else if (action === 'get-quizzes') {
            prompt = `Based on this learning material: ${JSON.stringify(currentMaterial)}, generate exactly 5 multiple choice quiz questions to test comprehension.
            The output MUST be in strict JSON format using this exact structure:
            {
              "quizzes": [
                {
                  "question": "Quiz question text in English?",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "answer": "Exact matching string of the correct option",
                  "explanation": "Brief explanation in Bahasa Indonesia why this answer is correct."
                }
              ]
            }
            Output MUST be valid JSON without any markdown wrappers.`;
        } else {
            return res.status(400).json({ error: "Action tidak dikenali." });
        }

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

        // Pembersihan format markdown code blocks secara agresif
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        const resultJson = JSON.parse(rawText);
        return res.status(200).json(resultJson);

    } catch (err) {
        console.error("Error di API Daily:", err);
        return res.status(500).json({ error: `Gagal memproses harian: ${err.message}` });
    }
}
