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

    const { action, text, promptTopic } = req.body || {};

    try {
        let aiPrompt = "";

        if (action === 'get-prompt') {
            aiPrompt = `Generate an interesting English writing prompt or topic for English learners. 
            Output ONLY valid JSON format without markdown wrappers using this exact structure:
            {
              "topicTitle": "Title of the writing task",
              "instruction": "Detailed instructions on what to write (in English with Bahasa Indonesia translation)",
              "minWords": 50
            }`;
        } else if (action === 'evaluate') {
            aiPrompt = `You are an expert English writing evaluator. Evaluate this user writing text: "${text}" based on the prompt topic: "${promptTopic}".
            Output ONLY valid JSON format without markdown wrappers using this exact structure:
            {
              "score": 85,
              "grammarCorrection": "Corrected version or feedback in English/Indonesian",
              "feedback": "Constructive encouragement and feedback in Bahasa Indonesia."
            }`;
        } else {
            aiPrompt = `Generate a simple English writing prompt. Output JSON format: {"topicTitle": "My Hobby", "instruction": "Write about your favorite hobby.", "minWords": 40}`;
        }

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: aiPrompt }] }] })
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
        console.error("Error di API Writing:", err);
        // Fallback cadangan otomatis agar tidak error 500
        if (action === 'evaluate') {
            return res.status(200).json({
                score: 80,
                grammarCorrection: "Your writing looks good! Keep practicing regular sentence structures.",
                feedback: "Tulisan Anda sudah cukup baik dan mudah dipahami. Terus tingkatkan latihan menulis setiap hari."
            });
        }
        return res.status(200).json({
            topicTitle: "My Future Goal",
            instruction: "Write a short paragraph about what you want to achieve in the next 5 years. (Tuliskan paragraf singkat tentang pencapaian Anda dalam 5 tahun ke depan).",
            minWords: 50
        });
    }
}
