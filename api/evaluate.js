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
            error: "API Keys tidak ditemukan di backend /api/evaluate." 
        });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

    // Tangkap data esai yang dikirim dari frontend writing.js
    const { text, topic, level } = req.body;

    try {
        const prompt = `You are an expert English writing examiner and instructor. Evaluate the following student's essay based on the topic provided.
        Student Level: ${level || 'B1'}
        Topic: "${topic}"
        Student's Essay: "${text}"

        Provide constructive corrections and explanations. The feedback/explanations MUST be written in Bahasa Indonesia so the student can easily understand, except for the native version.
        
        The output MUST be in strict JSON format without any markdown wrappers, using this exact structure matching the frontend:
        {
          "score": 85,
          "grammarCorrection": "Penjelasan detail koreksi tata bahasa dalam Bahasa Indonesia...",
          "vocabularyCorrection": "Saran peningkatan kosakata atau perbaikan kata dalam Bahasa Indonesia...",
          "naturalExpression": "Tips agar kalimat terdengar lebih natural atau mengalir dalam Bahasa Indonesia...",
          "nativeVersion": "The fully corrected, professional English native version of the essay...",
          "indonesianTranslation": "Terjemahan lengkap esai asli ke dalam Bahasa Indonesia..."
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

        // Pembersihan format markdown code blocks secara agresif
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        const evaluationData = JSON.parse(rawText);
        return res.status(200).json(evaluationData);

    } catch (err) {
        console.error("Error di API Evaluate:", err);
        return res.status(500).json({ error: `Gagal mengevaluasi tulisan: ${err.message}` });
    }
}
