import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    // 1. Ambil Semua API Key
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ error: "API Key Gemini belum dipasang di Vercel Environment Variables." });
    }

    const { theme } = req.body || {};
    const selectedTheme = theme || "General English Conversation";
    const seed = Date.now();

    const prompt = `You are an expert English Language Test Creator and Islamic Lecturer.
Generate 10 multiple-choice listening test items for students studying the topic "${selectedTheme}" (Seed: ${seed}).

Keep transcript short (2 sentences each) to remain concise.
Respond ONLY with a valid JSON array of 10 objects. No markdown, no pre-text:
[
  {
    "transcript": "Short English conversation or statement",
    "question": "Comprehension question in English",
    "options": ["A", "B", "C", "D"],
    "answer": "Exact string of correct choice from options",
    "explanation": "Penjelasan singkat bahasa Indonesia"
  }
]`;

    let lastError = "";

    // 2. Loop Mencoba Setiap API Key yang Ada secara Bergantian
    for (const apiKey of keys) {
        try {
            const ai = new GoogleGenAI({ apiKey });

            // Menggunakan SDK Resmi dengan model paling stabil & cepat saat ini: gemini-2.5-flash
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json"
                }
            });

            let rawText = response.text;
            if (!rawText) continue;

            // Pembersihan JSON
            rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const firstBracket = rawText.indexOf('[');
            const lastBracket = rawText.lastIndexOf(']');

            if (firstBracket !== -1 && lastBracket !== -1) {
                rawText = rawText.substring(firstBracket, lastBracket + 1);
            }

            const items = JSON.parse(rawText);

            if (Array.isArray(items) && items.length > 0) {
                // Berhasil! Langsung kirim 10 soal ke frontend
                return res.status(200).json({ items });
            }

        } catch (err) {
            lastError = err.message;
            console.warn(`[Key Failover Warning] Key berakhir ...${apiKey.slice(-4)} gagal:`, err.message);
            // Otomatis lanjut mencoba API Key berikutnya jika Key ini limit/error
        }
    }

    return res.status(500).json({
        error: `Semua API Key sedang limit/sibuk (${lastError}). Silakan coba beberapa saat lagi.`
    });
}
