export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    // 1. Ambil Semua API Key yang Tersedia
    const keys = [
        process.env.GEMINI_KEY_1, 
        process.env.GEMINI_KEY_2, 
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) return res.status(500).json({ error: "API Key tidak ditemukan di Environment Variables." });

    // Model resmi dan teruji
    const models = ["gemini-3.5-flash", "gemini-2.5-flash"];

    const { exclude = [] } = req.body || {};

    const prompt = `You are an expert English Language Pedagogy AI.
Generate a high-frequency daily vocabulary batch containing EXACTLY 5 practical words (CEFR B1-C1) and 10 varied quiz questions.

CRITICAL RULES:
1. Avoid repeating past words. DO NOT generate any of the following words: ${JSON.stringify(exclude)}. Choose entirely different words.
2. For each word, provide an Indonesian-friendly phonetic pronunciation guide (e.g., "Love" -> "Laf", "Religion" -> "relijen").
3. Output MUST be strictly valid JSON without markdown formatting, matching this exact structure:
{
  "theme": "High-Frequency Practical Vocab",
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
      "question": "Complete the sentence: 'We need to _____ on this project before Friday.'",
      "options": ["collaborate", "resilient", "bandwidth", "encrypted"],
      "answer": "collaborate",
      "explanation": "'Collaborate' berarti bekerja sama dalam menyelesaikan tugas."
    }
  ]
}`;

    let lastError = null;

    // 2. Loop Failover (Multi-Key x Multi-Model)
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
                            temperature: 0.5,
                            responseMimeType: "application/json" 
                        }
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    lastError = errData.error?.message || `HTTP ${response.status}`;
                    console.warn(`[Vocab Failover] Key ...${key.slice(-4)} & Model ${modelName} gagal: ${lastError}`);
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
                console.warn(`[Vocab API Exception] (${modelName}):`, err.message);
            }
        }
    }

    console.error("Semua API Key Vocab gagal. Menggunakan fallback lokal:", lastError);

    // 3. Fallback Lokal Cadangan
    return res.status(200).json({
        theme: "High-Frequency Practical Vocab",
        words: [
            { word: "Collaborate", pronunciation: "kolaboret", meaning: "Bekerja sama", example: "We need to collaborate on this project." },
            { word: "Resilient", pronunciation: "resilien", meaning: "Tangguh / Cepat bangkit", example: "She is very resilient despite challenges." },
            { word: "Bandwidth", pronunciation: "bendwid-th", meaning: "Kapasitas waktu/energi/data", example: "I don't have the bandwidth for extra tasks today." },
            { word: "Encrypted", pronunciation: "engkripted", meaning: "Tersandi / Terenkripsi", example: "Your messages are safely encrypted." },
            { word: "Milestone", pronunciation: "mailstoun", meaning: "Pencapaian penting", example: "Graduating was a big milestone for him." }
        ],
        quizzes: [
            {
                type: "fill-in-blank",
                question: "We need to _____ on this project before Friday.",
                options: ["collaborate", "resilient", "bandwidth", "encrypted"],
                answer: "collaborate",
                explanation: "'Collaborate' berarti bekerja sama."
            },
            {
                type: "definition",
                question: "Kata yang berarti 'tangguh dan cepat bangkit dari kesulitan' adalah...",
                options: ["resilient", "encrypted", "milestone", "bandwidth"],
                answer: "resilient",
                explanation: "'Resilient' menggambarkan sikap pantang menyerah dan tangguh."
            }
        ]
    });
}
