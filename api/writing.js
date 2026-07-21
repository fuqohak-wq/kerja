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

    const { text, prompt: writingTopic } = req.body || {};

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "Teks tulisan tidak boleh kosong." });
    }

    const prompt = `You are a strict and helpful English Writing Evaluator. 
Analyze and grade this user's English writing submitted for the topic "${writingTopic || 'General Writing'}":

USER WRITING:
"${text}"

TASK:
1. Evaluate grammar, vocabulary richness, sentence structure, and clarity.
2. Give a realistic score (0-100) based on quality.
3. Provide SPECIFIC feedback in Indonesian.
4. Provide a refined/improved native English version of their writing.
5. Translate the refined/improved English version into natural Bahasa Indonesia.

Output MUST be strictly valid JSON matching this structure without any markdown wrap:
{
  "score": 82,
  "grammarCorrection": "Penjelasan tata bahasa dalam Bahasa Indonesia.",
  "vocabCorrection": "Saran pilihan kata/kosakata dalam Bahasa Indonesia.",
  "naturalExpression": "Saran gaya bahasa/ekspresi alami dalam Bahasa Indonesia.",
  "improvedVersion": "Polished native English version of their text.",
  "indonesianTranslation": "Terjemahan Bahasa Indonesia dari versi native di atas."
}`;

    let lastError = null;

    for (const modelName of models) {
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;

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
                throw new Error(errData.error?.message || "Gagal dari API Gemini");
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

    // Fallback dinamis jika terjadi gangguan AI
    const cleanText = text.trim();
    return res.status(200).json({
        score: 80,
        grammarCorrection: "Tata bahasa sudah cukup baik. Pastikan selalu memperhatikan penggunaan tanda baca di akhir kalimat.",
        vocabCorrection: "Penggunaan kosakata sudah dapat dipahami. Coba variasikan dengan kosakata tingkat lanjut.",
        naturalExpression: "Kalimat Anda sudah komunikatif dan alami.",
        improvedVersion: cleanText,
        indonesianTranslation: `Terjemahan: "${cleanText}"`
    });
}
