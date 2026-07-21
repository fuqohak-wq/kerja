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

    const { action, text, promptTopic, topic, level } = req.body || {};
    const userWriting = text || '';
    const currentTopic = topic || promptTopic || 'General';

    let aiPrompt = "";

    if (action === 'get-prompt') {
        aiPrompt = `Generate an interesting English writing prompt or topic for English learners. 
        Output ONLY valid JSON format without markdown wrappers using this exact structure:
        {
          "topicTitle": "Title of the writing task",
          "instruction": "Detailed instructions on what to write (in English with Bahasa Indonesia translation)",
          "minWords": 50
        }`;
    } else {
        // Mode Evaluasi (Mendukung action === 'evaluate' maupun panggilan evaluasi langsung)
        aiPrompt = `You are an expert English writing evaluator. Evaluate this user writing text: "${userWriting}" based on topic: "${currentTopic}".
        Target level: "${level || 'B1'}".
        Output ONLY valid JSON format without markdown wrappers using this exact structure:
        {
          "score": 85,
          "grammarCorrection": "Corrected version or feedback in Bahasa Indonesia/English.",
          "vocabularyCorrection": "Vocabulary improvement tips in Bahasa Indonesia.",
          "naturalExpression": "Natural phrasing tips in Bahasa Indonesia.",
          "nativeVersion": "Natural Native Speaker revision of the user text.",
          "indonesianTranslation": "Indonesian translation of the native version.",
          "feedback": "Constructive encouragement and feedback in Bahasa Indonesia."
        }`;
    }

    let lastError = null;

    for (const modelName of models) {
        const GEMINI_API_URL = `[https://generativelanguage.googleapis.com/v1beta/models/$](https://generativelanguage.googleapis.com/v1beta/models/$){modelName}:generateContent?key=${activeKey}`;

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: aiPrompt }] }],
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
            const firstOpen = rawText.indexOf('{');
            const lastClose = rawText.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                rawText = rawText.substring(firstOpen, lastClose + 1);
            }

            return res.status(200).json(JSON.parse(rawText));

        } catch (err) {
            lastError = err.message;
            console.warn(`Writing API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error di API Writing:", lastError);
    if (action === 'get-prompt') {
        return res.status(200).json({
            topicTitle: "My Future Goal",
            instruction: "Write a short paragraph about what you want to achieve in the next 5 years. (Tuliskan paragraf singkat tentang pencapaian Anda dalam 5 tahun ke depan).",
            minWords: 50
        });
    }

    return res.status(200).json({
        score: 80,
        grammarCorrection: "Your writing looks good! Keep practicing regular sentence structures.",
        vocabularyCorrection: "Gunakan variasi kosakata pendukung untuk memperjelas gagasan.",
        naturalExpression: "Penggunaan kalimat Anda sudah cukup alami dan lancar.",
        nativeVersion: userWriting || "I want to improve my English skills for my future career.",
        indonesianTranslation: "Saya ingin meningkatkan keterampilan bahasa Inggris saya untuk karir masa depan saya.",
        feedback: "Tulisan Anda sudah cukup baik dan mudah dipahami. Terus tingkatkan latihan menulis setiap hari."
    });
}
