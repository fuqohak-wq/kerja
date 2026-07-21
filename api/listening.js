export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(Boolean);

    if (keys.length === 0) return res.status(500).json({ error: "API Keys tidak ditemukan." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    const { theme } = req.body || {};
    const prompt = `You are an expert English listening test creator. Generate an English listening practice exercise tailored to this theme: "${theme || 'General Knowledge'}". 
You MUST output ONLY valid JSON format using this exact structure, without any markdown backticks or extra text:
{
  "audioText": "A short and natural English listening passage (3-4 sentences long).",
  "question": "A comprehension question in English?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "The exact matching text of the correct option",
  "explanation": "Brief explanation in Bahasa Indonesia."
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

            return res.status(200).json(JSON.parse(rawText));

        } catch (err) {
            lastError = err.message;
            console.warn(`Listening API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error di API Listening:", lastError);
    return res.status(200).json({
        audioText: "Welcome to our daily conversation practice. Technology changes the way we communicate every single day.",
        question: "What does technology change according to the text?",
        options: ["The way we communicate", "The weather", "How planes fly", "The price of food"],
        answer: "The way we communicate",
        explanation: "Teks menyebutkan bahwa teknologi mengubah cara kita berkomunikasi setiap hari."
    });
}
