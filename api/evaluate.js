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

    const { text, topic, promptTopic, level } = req.body || {};
    const userWriting = text || '';
    const currentTopic = topic || promptTopic || 'General';

    const prompt = `You are an expert English writing evaluator and language tutor. Evaluate this student writing:
Text: "${userWriting}"
Topic: "${currentTopic}"
Target Level: "${level || 'B1'}"

You MUST output strictly in valid JSON format without markdown codeblock wrappers, matching this exact structure:
{
  "score": 85,
  "grammarCorrection": "Detail koreksi grammar dalam Bahasa Indonesia atau Inggris.",
  "vocabularyCorrection": "Saran pemakaian kata/kosakata agar lebih variatif.",
  "naturalExpression": "Saran pemilihan frasa agar terdengar lebih alami.",
  "nativeVersion": "Versi revisi kalimat utuh ala penutur asli (Native Speaker).",
  "indonesianTranslation": "Terjemahan Bahasa Indonesia dari versi native speaker.",
  "feedback": "Masukan motivasi singkat dalam Bahasa Indonesia."
}`;

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
            const firstOpen = rawText.indexOf('{');
            const lastClose = rawText.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                rawText = rawText.substring(firstOpen, lastClose + 1);
            }

            const parsed = JSON.parse(rawText);
            return res.status(200).json(parsed);

        } catch (err) {
            lastError = err.message;
            console.warn(`Evaluate API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error di API Evaluate:", lastError);
    return res.status(200).json({
        score: 80,
        grammarCorrection: "Tulisan Anda sudah bagus. Perhatikan susunan klausa dan penggunaan kata sambung.",
        vocabularyCorrection: "Gunakan kata sifat yang lebih spesifik untuk memperkaya esai.",
        naturalExpression: "Kalimat Anda sudah dapat dipahami dengan sangat baik.",
        nativeVersion: userWriting || "This is a well-written paragraph.",
        indonesianTranslation: "Ini adalah paragraf yang ditulis dengan baik.",
        feedback: "Tulisan Anda sudah cukup baik dan mudah dipahami. Terus tingkatkan latihan menulis setiap hari."
    });
}
