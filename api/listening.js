export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    // 1. Cek Ketersediaan API Keys
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) {
        console.error("[API Listening Error] API Keys Gemini tidak ditemukan di Environment Variables Vercel.");
        return res.status(500).json({ error: "API Key Gemini belum dipasang di Vercel Dashboard." });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const { theme, round } = req.body || {};
    const selectedTheme = theme || "General English Conversation";
    const seed = Date.now() + "_" + Math.floor(Math.random() * 10000);

    // Prompt yang sangat eksplisit tanpa mengandalkan fitur bawaan mimeType yang rentan error
    const prompt = `You are an expert English Language Test Creator and Islamic Lecturer.
Generate EXACTLY 1 multiple-choice listening test item for students studying the topic "${selectedTheme}" (Question #${round || 1}, Unique Seed: ${seed}).

Respond with ONLY a raw JSON object (no markdown formatting, no text before or after).
The JSON must follow this exact structure:
{
  "theme": "${selectedTheme}",
  "transcript": "Short English conversation or statement (2-3 sentences)",
  "question": "Comprehension question in English",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "The exact string of the correct choice from options",
  "explanation": "Brief explanation in Bahasa Indonesia"
}`;

    // Model fallback urut dari yang paling kompatibel
    const models = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro"];
    let lastErrorMessage = "";

    for (const modelName of models) {
        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;
            
            const apiRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800
                    }
                })
            });

            if (!apiRes.ok) {
                const errJson = await apiRes.json().catch(() => ({}));
                lastErrorMessage = errJson.error?.message || `HTTP ${apiRes.status}`;
                console.warn(`[Gemini Try Fail] Model ${modelName}:`, lastErrorMessage);
                continue; // Coba model berikutnya jika gagal
            }

            const data = await apiRes.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawText) {
                lastErrorMessage = "Respons teks dari AI kosong.";
                continue;
            }

            // Pembersihan JSON secara manual agar aman
            rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const firstBrace = rawText.indexOf('{');
            const lastBrace = rawText.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1) {
                rawText = rawText.substring(firstBrace, lastBrace + 1);
            }

            const parsedObj = JSON.parse(rawText);
            
            // Validasi kelengkapan bidang JSON
            if (parsedObj && parsedObj.transcript && parsedObj.question && Array.isArray(parsedObj.options)) {
                return res.status(200).json(parsedObj);
            }

        } catch (err) {
            lastErrorMessage = err.message;
            console.error(`[Gemini Exception] ${modelName}:`, err.message);
        }
    }

    // Jika semua model gagal
    return res.status(500).json({ 
        error: `Gagal meracik soal dari AI (${lastErrorMessage}). Mohon pastikan API Key Gemini aktif.` 
    });
}
