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

    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
    const { exclude = [] } = req.body || {};

    const prompt = `You are an expert English Pedagogy AI.
Generate a high-frequency vocabulary batch containing EXACTLY 5 practical words (CEFR B1-C1) and EXACTLY 12 varied quiz questions based on those 5 words.

CRITICAL RULES:
1. Avoid repeating past words. DO NOT generate: ${JSON.stringify(exclude)}.
2. Provide an Indonesian-friendly phonetic pronunciation guide for each word.
3. Questions MUST test those 5 words thoroughly (fill-in-the-blank, meaning lookup, definition match).

Output MUST be strictly valid JSON without markdown tags:
{
  "words": [
    { 
      "word": "Collaborate", 
      "pronunciation": "kolaboret",
      "meaning": "Bekerja sama", 
      "example": "We need to collaborate on this project." 
    }
  ],
  "quizzes": [
    {
      "type": "fill-in-blank", 
      "question": "Complete sentence: 'We need to _____ on this project before Friday.'",
      "options": ["collaborate", "resilient", "bandwidth", "encrypted"],
      "answer": "collaborate",
      "explanation": "'Collaborate' berarti bekerja sama."
    }
  ]
}`;

    let lastError = null;

    for (const key of keys) {
        for (const modelName of models) {
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;

            try {
                const response = await fetch(GEMINI_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { 
                            temperature: 0.6,
                            responseMimeType: "application/json" 
                        }
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    lastError = errData.error?.message || `HTTP ${response.status}`;
                    continue; 
                }

                const data = await response.json();
                let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!rawText) continue;

                rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
                const firstOpen = rawText.indexOf('{');
                const lastClose = rawText.lastIndexOf('}');
                if (firstOpen !== -1 && lastClose !== -1) {
                    rawText = rawText.substring(firstOpen, lastClose + 1);
                }

                const parsed = JSON.parse(rawText);
                if (parsed.words && parsed.quizzes) {
                    return res.status(200).json(parsed);
                }

            } catch (err) {
                lastError = err.message;
            }
        }
    }

    // Fallback Lokal
    return res.status(200).json({
        words: [
            { word: "Collaborate", pronunciation: "kolaboret", meaning: "Bekerja sama", example: "We need to collaborate." },
            { word: "Resilient", pronunciation: "resilien", meaning: "Tangguh / Cepat bangkit", example: "She is very resilient." },
            { word: "Bandwidth", pronunciation: "bendwid-th", meaning: "Kapasitas waktu/energi", example: "I don't have the bandwidth today." },
            { word: "Encrypted", pronunciation: "engkripted", meaning: "Tersandi / Terenkripsi", example: "Messages are encrypted." },
            { word: "Milestone", pronunciation: "mailstoun", meaning: "Pencapaian penting", example: "Graduating was a big milestone." }
        ],
        quizzes: [
            { type: "fill-in-blank", question: "We need to _____ on this project.", options: ["collaborate", "resilient", "bandwidth", "encrypted"], answer: "collaborate", explanation: "'Collaborate' berarti bekerja sama." },
            { type: "definition", question: "Kata yang berarti 'tangguh' adalah...", options: ["resilient", "encrypted", "milestone", "bandwidth"], answer: "resilient", explanation: "'Resilient' menggambarkan sifat tangguh." },
            { type: "meaning", question: "Apa arti dari kata 'Milestone'?", options: ["Pencapaian penting", "Bekerja sama", "Kapasitas waktu", "Tersandi"], answer: "Pencapaian penting", explanation: "'Milestone' adalah tonggak pencapaian." }
        ]
    });
}
