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

    // 4. Daftar Model Google yang dicoba bergantian (Auto-Detect)
    const availableModels = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];

    let lastError = "";

    // Loop mencoba satu per satu model sampai ada yang berhasil
    for (const modelName of availableModels) {
        try {
            const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;

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
                lastError = errData.error?.message || `HTTP ${response.status}`;
                console.warn(`[Model ${modelName} Gagal]: ${lastError}`);
                continue; // Lanjut mencoba model berikutnya
            }

            const data = await response.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawText) continue;

            // Pembersihan Teks JSON
            rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const firstBrace = rawText.indexOf('{');
            const lastBrace = rawText.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1) {
                rawText = rawText.substring(firstBrace, lastBrace + 1);
            }

            const parsedObj = JSON.parse(rawText);
            // Berhasil! Kirim respons ke frontend
            return res.status(200).json(parsedObj);

        } catch (err) {
            lastError = err.message;
            console.error(`[Exception ${modelName}]:`, err.message);
        }
    }

    // Jika semua model dalam list gagal
    return res.status(500).json({ 
        error: `Gagal meracik soal dari AI (${lastError}). Silakan klik tombol lagi.` 
    });
}
