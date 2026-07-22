export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean);
    if (keys.length === 0) return res.status(500).json({ error: "API Keys tidak ditemukan di Environment Variable." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const modelName = "gemini-1.5-flash"; // Model resmi stabil Google

    const randomThemes = ["Technology", "Emotions & Mindset", "Nature & Travel", "Culinary & Food", "Business & Work", "Art & Creativity", "Health & Wellness", "Daily Life"];
    const pickedTheme = randomThemes[Math.floor(Math.random() * randomThemes.length)];
    const seed = Date.now() + "_" + Math.floor(Math.random() * 1000);

    const prompt = `You are a dynamic English Language AI Tutor.
Generate 5 fresh English vocabulary words for theme "${pickedTheme}" (Seed: ${seed}) AND 5 multiple-choice quiz questions testing those exact 5 words.

OUTPUT MUST BE STRICTLY VALID JSON (NO MARKDOWN CODEBLOCKS) MATCHING THIS EXACT STRUCTURE:
{
  "theme": "${pickedTheme}",
  "words": [
    { "word": "English Word", "meaning": "Arti Bahasa Indonesia", "example": "Example sentence in English." }
  ],
  "quizzes": [
    {
      "question": "What is the meaning of 'English Word'?",
      "options": ["Correct Meaning", "Wrong Option 1", "Wrong Option 2", "Wrong Option 3"],
      "answer": "Correct Meaning",
      "explanation": "Brief explanation in Bahasa Indonesia."
    }
  ]
}`;

    // URL API GEMINI YANG BENAR (SUDAH DIPERBAIKI SINTAKS $ NYA)
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
            throw new Error(errData.error?.message || "Response Not OK from Gemini");
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

        const parsedData = JSON.parse(rawText);
        return res.status(200).json(parsedData);

    } catch (err) {
        console.error("Error Vocab Gemini API:", err.message);
        // Fallback jika API benar-benar limit
        return res.status(200).json({
            theme: "Emotions (Fallback)",
            words: [
                { word: "Ecstatic", meaning: "Sangat gembira", example: "She was ecstatic when she passed." },
                { word: "Apprehensive", meaning: "Cemas / Khawatir", example: "He felt apprehensive before the test." },
                { word: "Compassionate", meaning: "Penuh kasih sayang", example: "A good leader is compassionate." },
                { word: "Overwhelmed", meaning: "Kewalahan", example: "Don't feel overwhelmed." },
                { word: "Serene", meaning: "Tenang / Damai", example: "The morning was serene." }
            ],
            quizzes: [
                { question: "Apa arti dari 'Ecstatic'?", options: ["Sangat gembira", "Cemas", "Tenang", "Kewalahan"], answer: "Sangat gembira", explanation: "Ecstatic berarti sangat gembira." },
                { question: "Apa arti dari 'Apprehensive'?", options: ["Cemas / Khawatir", "Gembira", "Kasih sayang", "Damai"], answer: "Cemas / Khawatir", explanation: "Apprehensive artinya cemas." }
            ]
        });
    }
}
