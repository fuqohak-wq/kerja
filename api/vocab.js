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

    const { action, currentMaterial } = req.body || {};
    let prompt = "";

    if (action === 'get-material-bulk') {
        prompt = `Generate a JSON array containing 10 diverse daily vocabulary themes for English learners. 
        You MUST output ONLY valid JSON array using this exact structure without markdown:
        [
          {
            "theme": "Theme title in English",
            "words": [
              {"word": "word 1", "meaning": "Arti Indonesia", "example": "Example sentence."},
              {"word": "word 2", "meaning": "Arti Indonesia", "example": "Example sentence."}
            ]
          }
        ]`;
    } else if (action === 'get-quizzes') {
        prompt = `Based on this vocabulary material: ${JSON.stringify(currentMaterial || {})}, generate exactly 5 multiple choice quiz questions.
        Output ONLY valid JSON format:
        {
          "quizzes": [
            {
              "question": "Quiz question text in English?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "Exact matching string of the correct option",
              "explanation": "Brief explanation in Bahasa Indonesia."
            }
          ]
        }`;
    } else {
        prompt = `Generate a JSON array containing 5 diverse daily vocabulary themes for English learners. Output valid JSON array without markdown.`;
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
                throw new Error(errData.error?.message || "Gagal dari Google API");
            }

            const data = await response.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error("Respons AI kosong.");

            rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const firstOpen = rawText.indexOf(action === 'get-material-bulk' ? '[' : '{');
            const lastClose = rawText.lastIndexOf(action === 'get-material-bulk' ? ']' : '}');
            if (firstOpen !== -1 && lastClose !== -1) {
                rawText = rawText.substring(firstOpen, lastClose + 1);
            }

            return res.status(200).json(JSON.parse(rawText));

        } catch (err) {
            lastError = err.message;
            console.warn(`Vocab API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error di API Vocab:", lastError);
    if (action === 'get-quizzes') {
        return res.status(200).json({
            quizzes: [
                {
                    question: "What is the meaning of 'Achieve'?",
                    options: ["Mencapai", "Gagal", "Menyerah", "Menolak"],
                    answer: "Mencapai",
                    explanation: "Achieve berarti berhasil mencapai suatu tujuan."
                }
            ]
        });
    }

    return res.status(200).json([
        {
            theme: "Daily Workplace",
            words: [
                { word: "Deadline", meaning: "Batas waktu", example: "The deadline is tomorrow." },
                { word: "Schedule", meaning: "Jadwal", example: "Check your schedule." }
            ]
        }
    ]);
}
