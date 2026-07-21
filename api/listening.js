export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean);
    if (keys.length === 0) return res.status(500).json({ error: "API Keys tidak ditemukan." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const models = ["gemini-1.5-flash", "gemini-2.5-flash"];

    const { theme, round } = req.body || {};
    const selectedTheme = theme || "General English Conversation";
    const seed = Date.now() + "_" + Math.floor(Math.random() * 10000);

    // PROMPT SUPER RINGAN: HANYA MINTA 1 SOAL
    const prompt = `You are an expert English Test Creator and Islamic Lecturer.
Create EXACTLY 1 unique, natural English listening comprehension test item based on the topic "${selectedTheme}" (Question Number: ${round || 1}, Seed: ${seed}).

Provide:
1. transcript: A short natural English conversation or passage (2-3 lines) related to ${selectedTheme}.
2. question: A clear comprehension question in English.
3. options: 4 distinct choices in English.
4. answer: The exact correct choice text.
5. explanation: Brief explanation in Bahasa Indonesia.

OUTPUT FORMAT MUST BE A STRICT SINGLE VALID JSON OBJECT (NO MARKDOWN CODEBLOCKS):
{
  "theme": "${selectedTheme}",
  "transcript": "...",
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "answer": "...",
  "explanation": "..."
}`;

    for (const modelName of models) {
        try {
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;
            
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        responseMimeType: "application/json",
                        temperature: 0.8 
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (rawText) {
                    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
                    const firstOpen = rawText.indexOf('{');
                    const lastClose = rawText.lastIndexOf('}');
                    if (firstOpen !== -1 && lastClose !== -1) {
                        rawText = rawText.substring(firstOpen, lastClose + 1);
                    }
                    return res.status(200).json(JSON.parse(rawText));
                }
            }
        } catch (err) {
            console.warn(`Listening API (${modelName}) Warning:`, err.message);
        }
    }

    return res.status(500).json({ error: "Gagal meracik soal dari AI. Silakan coba klik tombol lagi." });
}
