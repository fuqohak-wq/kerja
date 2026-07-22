export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [
        process.env.GEMINI_KEY_1, 
        process.env.GEMINI_KEY_2, 
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) return res.status(500).json({ error: "API Key tidak ditemukan." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    // PROMPT KETAT: Mengunci AI agar HANYA memilih kata mainstream & akademik populer
    const prompt = `You are an expert English Tutor. 
Generate a daily batch containing EXACTLY 50 highly practical, highly common, and mainstream English vocabulary words (CEFR B1-C1 level) used in daily conversations, academic discussions, or general knowledge. 

DO NOT use rare, obsolete, or overly poetic words. Focus on high-frequency words that non-native speakers genuinely need (e.g., words like 'Perspective', 'Analyze', 'Significant', 'Crucial', 'Cooperate', 'Fascinating', 'Maintain', etc.).

Along with the 50 words, generate 50 multiple-choice quiz questions testing those exact words.

Output MUST be strictly valid JSON without markdown formatting, matching this exact structure:
{
  "theme": "Practical & Academic High-Frequency Vocab",
  "words": [
    { "word": "Practical Word", "meaning": "Arti Indonesia yang umum & mudah dipahami", "example": "Natural sentence used in daily life or study." }
  ],
  "quizzes": [
    {
      "question": "What is the most accurate meaning of 'Practical Word'?",
      "options": ["Correct Meaning", "Wrong Option 1", "Wrong Option 2", "Wrong Option 3"],
      "answer": "Correct Meaning",
      "explanation": "Penjelasan singkat dan jelas dalam Bahasa Indonesia."
    }
  ]
}`;

    let lastError = null;

    for (const modelName of models) {
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
                throw new Error(errData.error?.message || "Gagal dari API Google");
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
            console.warn(`Vocab API (${modelName}) warning:`, err.message);
        }
    }

    return res.status(500).json({ error: "Gagal memanggil AI: " + lastError });
}
