export default async function handler(req, res) {
    // 1. Header CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    // 2. Ambil API Key dari Vercel Environment Variables
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ error: "API Key Gemini belum disetting di Vercel Environment Variables." });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const { theme, round } = req.body || {};
    const selectedTheme = theme || "General English Conversation";
    const seed = Date.now() + "_" + Math.floor(Math.random() * 10000);

    // 3. Prompt Soal Tunggal
    const prompt = `You are an expert English Language Test Creator and Islamic Lecturer.
Generate EXACTLY 1 multiple-choice listening test item for students studying the topic "${selectedTheme}" (Question #${round || 1}, Seed: ${seed}).

Respond with ONLY a raw valid JSON object (no markdown, no preamble):
{
  "theme": "${selectedTheme}",
  "transcript": "Short English conversation or statement (2-3 sentences)",
  "question": "Comprehension question in English",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "The exact string of the correct choice from options",
  "explanation": "Brief explanation in Bahasa Indonesia"
}`;

    // 4. Panggil URL API Google Resmi (Menggunakan Model gemini-1.5-flash saja)
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const msg = errData.error?.message || `HTTP ${response.status}`;
            throw new Error(`Google API: ${msg}`);
        }

        const data = await response.json();
        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) throw new Error("Respons AI kosong.");

        // Pembersihan Teks JSON
        rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            rawText = rawText.substring(firstBrace, lastBrace + 1);
        }

        const parsedObj = JSON.parse(rawText);
        return res.status(200).json(parsedObj);

    } catch (err) {
        console.error("Listening Backend Error:", err.message);
        return res.status(500).json({ 
            error: `Gagal meracik soal dari AI (${err.message}). Silakan klik tombol lagi.` 
        });
    }
}
