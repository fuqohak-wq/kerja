export default async function handler(req, res) {
    // 1. Header CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    // 2. Ambil Semua API Key dari Vercel
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ error: "API Key Gemini belum disetting di Vercel Environment Variables." });
    }

    const { theme } = req.body || {};
    const selectedTheme = theme || "General English Conversation";
    const seed = Date.now();

    // 3. Prompt Ringkas untuk 10 Soal Sekaligus
    const prompt = `You are an expert English Language Test Creator and Islamic Lecturer.
Generate 10 multiple-choice listening test items for students studying the topic "${selectedTheme}" (Seed: ${seed}).

Keep transcript short (2 sentences each) to remain concise.
Respond ONLY with a valid JSON array of 10 objects. No markdown formatting, no pre-text, no post-text:
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

    // 4. Loop Mencoba Setiap API Key Secara Bergantian (Rotasi Otomatis)
    for (const key of keys) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 3500
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                lastError = errData.error?.message || `HTTP ${response.status}`;
                console.warn(`[Key Failover Warning] Key ...${key.slice(-4)} gagal: ${lastError}`);
                continue; // Lanjut ke API Key berikutnya jika Key ini limit/error
            }

            const data = await response.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

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
                // Sukses! Kembalikan 10 soal ke frontend
                return res.status(200).json({ items });
            }

        } catch (err) {
            lastError = err.message;
            console.error(`[Gemini Exception]`, err.message);
        }
    }

    // 5. Jika semua key gagal, kirimkan respon JSON yang valid agar frontend tidak mengalami SyntaxError
    return res.status(500).json({
        error: `Layanan AI sedang sibuk (${lastError}). Silakan klik tombol tema sekali lagi.`
    });
}
