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
    let prompt = "";

    if (action === 'get-quizzes') {
        prompt = `Based on this vocabulary context/material: ${JSON.stringify(currentMaterial || {})}, generate EXACTLY 5 multiple choice quiz questions.
Output MUST be strictly in valid JSON format matching this structure:
{
  "quizzes": [
    {
      "question": "Question about word meaning or context in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Exact matching string of correct option",
      "explanation": "Penjelasan singkat mengapa jawaban ini benar dalam Bahasa Indonesia."
    }
  ]
}`;
    } else {
        // Default / get-material-bulk: Minta 5 Tema/Kosakata harian
        prompt = `Generate 5 daily English vocabulary items with practical examples for learners.
Output MUST be strictly a valid JSON array matching this structure:
[
  {
    "theme": "Daily Life / Workplace / Travel / Tech / Social",
    "word": "Word or Phrase",
    "meaning": "Arti kata dalam Bahasa Indonesia",
    "example": "Example sentence in English."
  }
]`;
    }

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
                throw new Error(errData.error?.message || "Gagal dari API Google");
            }

            const data = await response.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error("Respons AI kosong.");

            rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
            
            // Ekstrak JSON murni
            const isArrayReq = action !== 'get-quizzes';
            const firstOpen = rawText.indexOf(isArrayReq ? '[' : '{');
            const lastClose = rawText.lastIndexOf(isArrayReq ? ']' : '}');
            if (firstOpen !== -1 && lastClose !== -1) {
                rawText = rawText.substring(firstOpen, lastClose + 1);
            }

            const parsed = JSON.parse(rawText);
            return res.status(200).json(parsed);

        } catch (err) {
            lastError = err.message;
            console.warn(`Vocab API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error Vocab API:", lastError);

    // Fallback jika API terbentur limit
    if (action === 'get-quizzes') {
        return res.status(200).json({
            quizzes: [
                { question: "Apa arti dari kata 'Achieve'?", options: ["Mencapai", "Menyerah", "Menolak", "Menunda"], answer: "Mencapai", explanation: "Achieve berarti berhasil mencapai suatu tujuan." },
                { question: "Manakah contoh penggunaan 'Improve' yang tepat?", options: ["I want to improve my English.", "I improve to sleep.", "She improve water.", "They improve yesterday."], answer: "I want to improve my English.", explanation: "Improve berarti meningkatkan keterampilan atau kualitas." },
                { question: "Sinonim dari kata 'Crucial' adalah...", options: ["Important", "Easy", "Small", "Useless"], answer: "Important", explanation: "Crucial bermakna sangat penting atau krusial." },
                { question: "Apa arti dari kata 'Enthusiastic'?", options: ["Antusias", "Sedih", "Marah", "Lelah"], answer: "Antusias", explanation: "Enthusiastic berarti menunjukkan semangat atau antusiasme tinggi." },
                { question: "Pilih kata yang tepat: 'She showed great _____ in her work.'", options: ["Dedication", "Dedicating", "Dedicate", "Dedicated"], answer: "Dedication", explanation: "Kata benda (noun) 'Dedication' tepat untuk melengkapi kalimat tersebut." }
            ]
        });
    }

    return res.status(200).json([
        { theme: "Workplace", word: "Accomplish", meaning: "Menyelesaikan / Mencapai", example: "We accomplished all our goals today." },
        { theme: "Daily Life", word: "Convenient", meaning: "Praktis / Memudahkan", example: "Online shopping is very convenient." },
        { theme: "Education", word: "Grasp", meaning: "Memahami", example: "She quickly grasped the new grammar rules." },
        { theme: "Communication", word: "Articulate", meaning: "Pandai berbicara / Jelas", example: "He gave an articulate presentation." },
        { theme: "Lifestyle", word: "Consistency", meaning: "Konsistensi / Keselarasan", example: "Consistency is key to mastering English." }
    ]);
}
