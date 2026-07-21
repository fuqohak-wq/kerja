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

    const { action, currentMaterial } = req.body || {};
    
    const randomThemes = ["Technology", "Emotion & Feelings", "Nature & Environment", "Cooking & Food", "Travel & Adventure", "Business & Finance", "Art & Music", "Health & Fitness", "Social Media", "Science"];
    const pickedTheme = randomThemes[Math.floor(Math.random() * randomThemes.length)];
    const seed = Date.now() + "_" + Math.random();

    let prompt = "";

    if (action === 'get-quizzes') {
        // PERINTAH KETAT: Minta AI membuat 5 soal berdasarkan KATA YANG ADA pada currentMaterial saja!
        prompt = `You are a quiz generator. Based STRICTLY on this vocabulary material provided: ${JSON.stringify(currentMaterial || {})}, generate EXACTLY 5 multiple-choice quiz questions to test comprehension of THESE EXACT WORDS.
Output MUST be strictly in valid JSON format matching this structure:
{
  "quizzes": [
    {
      "question": "Question testing one of the words above in English?",
      "options": ["Correct Meaning/Answer", "Wrong Option 1", "Wrong Option 2", "Wrong Option 3"],
      "answer": "Exact matching string of correct option",
      "explanation": "Brief explanation in Bahasa Indonesia."
    }
  ]
}`;
    } else {
        prompt = `Generate 5 fresh English vocabulary words related to the theme "${pickedTheme}" for English learners (Seed: ${seed}).
Output MUST be strictly a valid JSON array matching this structure:
[
  {
    "theme": "${pickedTheme}",
    "word": "English Word",
    "meaning": "Arti kata dalam Bahasa Indonesia",
    "example": "Example sentence using the word."
  }
]`;
    }

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
            
            const isArrayReq = action !== 'get-quizzes';
            const firstOpen = rawText.indexOf(isArrayReq ? '[' : '{');
            const lastClose = rawText.lastIndexOf(isArrayReq ? ']' : '}');
            if (firstOpen !== -1 && lastClose !== -1) {
                rawText = rawText.substring(firstOpen, lastClose + 1);
            }

            return res.status(200).json(JSON.parse(rawText));

        } catch (err) {
            lastError = err.message;
            console.warn(`Vocab API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error Vocab API (Menggunakan fallback cerdas yang sinkron):", lastError);

    // =========================================================================
    // FALLBACK CERDAS: Jika AI Error, Buat Soal Kuis LANGSUNG DARI Kata yang Ditampilkan!
    // =========================================================================
    if (action === 'get-quizzes') {
        const wordsList = Array.isArray(currentMaterial) ? currentMaterial : (currentMaterial?.words || []);
        
        if (wordsList.length > 0) {
            const smartQuizzes = wordsList.slice(0, 5).map((w) => ({
                question: `Apa arti dari kata '${w.word}'?`,
                options: [
                    w.meaning,
                    "Tidakan menunda sesuatu",
                    "Kondisi tidak stabil",
                    "Proses secara bertahap"
                ].sort(() => Math.random() - 0.5), // Acak pilihan jawaban
                answer: w.meaning,
                explanation: `'${w.word}' artinya "${w.meaning}". Contoh: "${w.example || ''}"`
            }));
            
            return res.status(200).json({ quizzes: smartQuizzes });
        }
    }

    // Paket Kosakata Cadangan Jika Panggilan Awal Gagal Total
    const fallbackMaterials = [
        [
            { theme: "Emotions", word: "Ecstatic", meaning: "Sangat gembira / Sangat senang", example: "She was ecstatic when she passed the exam." },
            { theme: "Emotions", word: "Apprehensive", meaning: "Cemas / Khawatir", example: "He felt apprehensive before the job interview." },
            { theme: "Emotions", word: "Compassionate", meaning: "Penuh kasih sayang / Empati", example: "A good leader is always compassionate." },
            { theme: "Emotions", word: "Overwhelmed", meaning: "Kewalahan / Terlalu banyak beban", example: "Don't feel overwhelmed by your big goals." },
            { theme: "Emotions", word: "Serene", meaning: "Tenang / Damai", example: "The lake looked beautiful and serene in the morning." }
        ]
    ];

    return res.status(200).json(fallbackMaterials[0]);
}
