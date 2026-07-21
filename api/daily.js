export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean);
    if (keys.length === 0) return res.status(500).json({ error: "API Keys tidak ditemukan." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    const { action, type, currentMaterial } = req.body || {};
    let prompt = "";

    if (action === 'get-quizzes') {
        prompt = `Based on this learning material: ${JSON.stringify(currentMaterial || {})}, generate EXACTLY 5 multiple choice quiz questions.
Output MUST be strictly in valid JSON format matching:
{
  "quizzes": [
    {
      "question": "Question text in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Exact matching string of correct option",
      "explanation": "Penjelasan singkat dalam Bahasa Indonesia."
    }
  ]
}`;
    } else {
        if (type === 'vocab') {
            prompt = `Generate 5 daily English vocabulary items.
Output MUST be strictly a valid JSON array:
[
  { "theme": "General", "word": "Word", "meaning": "Arti Indonesia", "example": "Example sentence." }
]`;
        } else {
            prompt = `Generate 5 essential English grammar topics.
Output MUST be strictly a valid JSON array:
[
  { "topic": "Topic Name", "explanation": "Penjelasan Indonesia", "formula": "Subject + ..." }
]`;
        }
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

            if (!response.ok) throw new Error("Gagal dari Google API");

            const data = await response.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error("Respons AI kosong.");

            rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

            const isArrayReq = action !== 'get-quizzes';
            const firstOpen = rawText.indexOf(isArrayReq ? '[' : '{');
            const lastClose = rawText.lastIndexOf(isArrayReq ? ']' : '}');
            if (firstOpen !== -1 && lastClose !== -1) {
                rawText = rawText.substring(firstOpen, lastClose + 1);
            }

            return res.status(200).json(JSON.parse(rawText));

        } catch (err) {
            lastError = err.message;
            console.warn(`Daily API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error Daily API:", lastError);
    return res.status(500).json({ error: lastError });
}
