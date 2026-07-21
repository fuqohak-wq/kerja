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
        return res.status(500).json({ 
            error: "API Keys tidak ditemukan. Harap atur GEMINI_KEY_1 di Environment Variables Vercel." 
        });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    const { action, type, currentMaterial } = req.body || {};
    let prompt = "";

    if (action === 'get-material-bulk') {
        if (type === 'vocab') {
            prompt = `Generate a JSON array containing 10 diverse daily vocabulary themes for English learners. 
            Each item must follow this exact structure:
            {
              "theme": "Theme title in English",
              "words": [
                {"word": "word 1", "meaning": "Arti Indonesia", "example": "Example sentence."},
                {"word": "word 2", "meaning": "Arti Indonesia", "example": "Example sentence."}
              ]
            }
            Output MUST be a valid JSON array of objects without any markdown wrappers or text outside JSON.`;
        } else {
            prompt = `Generate a JSON array containing 10 essential English grammar masterclass topics. 
            Each item must follow this exact structure:
            {
              "topic": "Grammar topic name",
              "explanation": "Clear explanation in Bahasa Indonesia",
              "formula": "Subject + ..."
            }
            Output MUST be a valid JSON array of objects without any markdown wrappers or text outside JSON.`;
        }
    } else if (action === 'get-quizzes') {
        prompt = `Based on this learning material: ${JSON.stringify(currentMaterial || {})}, generate exactly 5 multiple choice quiz questions to test comprehension.
        The output MUST be in strict JSON format using this exact structure:
        {
          "quizzes": [
            {
              "question": "Quiz question text in English?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "Exact matching string of the correct option",
              "explanation": "Brief explanation in Bahasa Indonesia."
            }
          ]
        }
        Output MUST be valid JSON without any markdown wrappers.`;
    } else {
        return res.status(400).json({ error: "Action tidak dikenali." });
    }

    let lastError = null;

    for (const modelName of models) {
        const GEMINI_API_URL = `[https://generativelanguage.googleapis.com/v1beta/models/$](https://generativelanguage.googleapis.com/v1beta/models/$){modelName}:generateContent?key=${activeKey}`;

        try {
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
                throw new Error(errData.error?.message || `HTTP error ${response.status}`);
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0].content) {
                throw new Error("Respon kosong dari AI.");
            }

            let rawText = data.candidates[0].content.parts[0].text;
            rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

            const resultJson = JSON.parse(rawText);
            return res.status(200).json(resultJson);

        } catch (err) {
            lastError = err.message;
            console.warn(`Daily API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Semua model Gemini gagal di /api/daily:", lastError);
    return res.status(500).json({ error: `Gagal memproses harian: ${lastError}` });
}
