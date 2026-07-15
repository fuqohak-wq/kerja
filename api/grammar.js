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

    const { action, currentMaterial } = req.body;
    let prompt = "";

    if (action === 'get-material-bulk') {
        prompt = `Generate a JSON array containing 10 essential English grammar masterclass topics. 
        Each item must follow this exact structure:
        {
          "topic": "Grammar topic name",
          "explanation": "Clear explanation in Bahasa Indonesia",
          "formula": "Subject + ..."
        }
        Output MUST be a valid JSON array without any markdown wrappers.`;
    } else if (action === 'get-quizzes') {
        prompt = `Based on this grammar material: ${JSON.stringify(currentMaterial || {})}, generate exactly 5 multiple choice quiz questions.
        The output MUST be in strict JSON format:
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
        Output MUST be valid JSON without markdown wrappers.`;
    } else {
        prompt = `Generate a JSON array containing 5 essential English grammar masterclass topics. Output valid JSON array without markdown wrappers.`;
    }

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
        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        return res.status(200).json(JSON.parse(rawText));
    } catch (err) {
        console.error("Error di Grammar API:", err);
        return res.status(500).json({ error: err.message });
    }
}
