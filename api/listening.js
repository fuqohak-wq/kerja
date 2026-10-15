export default async function handler(req, res) {
    // 1. Header CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    // 2. Ambil Semua API Key
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

    // 3. Model Fallback List (Model stabil yang didukung REST v1beta)
    const models = ["gemini-3.5-flash", "gemini-2.5-flash"];

    const prompt = `You are an expert English Language Test Creator and Islamic Lecturer.
Generate 10 multiple-choice listening test items for students studying the topic "${selectedTheme}" (Seed: ${seed}).

Keep transcript short (2 sentences each) to remain concise.
Respond strictly in JSON array format containing 10 objects with keys: "transcript", "question", "options" (array of 4 strings), "answer" (exact string from options), and "explanation" (in Indonesian).`;

    let lastError = "";

    // 4. Loop Failover (Rotasi Key & Model)
    for (const key of keys) {
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.5,
                            maxOutputTokens: 4000,
                            responseMimeType: "application/json" // Memaksa AI mengembalikan JSON valid
                        }
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    lastError = errData.error?.message || `HTTP ${response.status}`;
                    console.warn(`[Failover] Key ...${key.slice(-4)} & Model ${model} gagal: ${lastError}`);
                    continue; 
                }

                const data = await response.json();
                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!rawText) continue;

                const items = JSON.parse(rawText);

                if (Array.isArray(items) && items.length > 0) {
                    return res.status(200).json({ items });
                }

            } catch (err) {
                lastError = err.message;
                console.error(`[Gemini Exception]`, err.message);
            }
        }
    }

    return res.status(500).json({
        error: `Layanan AI sedang sibuk (${lastError}). Silakan coba lagi.`
    });
}
