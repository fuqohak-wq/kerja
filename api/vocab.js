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

    const prompt = `You are an expert English Language Pedagogy AI.
Generate a high-frequency daily vocabulary batch containing EXACTLY 50 practical words (CEFR B1-C1) and EXACTLY 20 VARIATED quiz questions testing those words.

The 20 quiz questions MUST be a mix of:
1. Standard Multiple Choice (Meaning lookup)
2. Fill-in-the-blank / Sentence Context (e.g., "The team needs to _____ to solve this. [collaborate, encrypted...]")
3. Word Guessing / Definition Match (e.g., "Which word best matches: 'A goal or target date for finishing work'?")

Output MUST be strictly valid JSON without markdown formatting, matching this exact structure:
{
  "theme": "High-Frequency Practical Vocab",
  "words": [
    { "word": "Collaborate", "meaning": "Bekerja sama", "example": "We need to collaborate." }
  ],
  "quizzes": [
    {
      "type": "fill-in-blank", 
      "question": "Complete the sentence: 'We need to _____ on this project before Friday.'",
      "options": ["collaborate", "resilient", "bandwidth", "encrypted"],
      "answer": "collaborate",
      "explanation": "'Collaborate' berarti bekerja sama dalam menyelesaikan tugas."
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
