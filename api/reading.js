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

    const bodyData = req.body || {};
    const theme = bodyData.theme || 'General Knowledge';

    const prompt = `You are an expert English reading comprehension test creator. Generate an English reading exercise tailored to this theme: "${theme}". 
You MUST output ONLY valid JSON format using this exact structure without any markdown backticks or extra text:
{
  "paragraph1": "First paragraph of the reading article in English...",
  "paragraph2": "Second paragraph of the reading article in English...",
  "paragraph3": "Third paragraph of the reading article in English...",
  "vocabularyMap": {
    "keyWord1": "arti kata 1 dalam Bahasa Indonesia",
    "keyWord2": "arti kata 2 dalam Bahasa Indonesia"
  },
  "question": "Reading comprehension question in English based on the article above?",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "answer": "The exact matching text of the correct option",
  "explanation": "Brief explanation in Bahasa Indonesia why this answer is correct."
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
            console.warn(`Reading API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error di API Reading:", lastError);
    return res.status(200).json({
        paragraph1: "Reading is one of the most effective ways to expand your English vocabulary and improve your grammar naturally.",
        paragraph2: "When you read regularly, your brain subconsciously absorbs sentence structures and native expressions without memorizing strict rules.",
        paragraph3: "Make it a daily habit to read articles, short stories, or books that match your personal interests and current proficiency level.",
        vocabularyMap: { "vocabulary": "kosakata", "subconsciously": "secara bawah sadar" },
        question: "What is one of the benefits of reading regularly according to the text?",
        options: ["Expand vocabulary and grammar", "Make you fall asleep", "Improve your speaking speed only", "Decrease concentration"],
        answer: "Expand vocabulary and grammar",
        explanation: "Teks menyatakan membaca adalah cara efektif memperluas kosakata dan memperbaiki tata bahasa."
    });
}
