export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    // 1. Ambil API Keys dari Environment Variables
    const keys = [
        process.env.GEMINI_KEY_1, 
        process.env.GEMINI_KEY_2, 
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY // Jaga-jaga jika menggunakan nama standar
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ 
            error: "API Key Gemini tidak ditemukan! Pastikan GEMINI_KEY_1 sudah diset di Vercel Environment Variables." 
        });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    
    // Gunakan daftar model terbaru
    const candidateModels = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.0-flash-exp"];

    const randomThemes = ["Technology", "Emotions", "Nature & Travel", "Culinary", "Business", "Health", "Space", "Art"];
    const pickedTheme = randomThemes[Math.floor(Math.random() * randomThemes.length)];
    const seed = Date.now() + "_" + Math.floor(Math.random() * 100000);

    const prompt = `You are a dynamic English Language AI Tutor.
Generate 5 FRESH and CREATIVE English vocabulary words for theme "${pickedTheme}" (Unique Seed: ${seed}) AND 5 multiple-choice quiz questions testing those exact 5 words.

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

    let lastErrorMessage = "";

    // Coba loop melalui model kandidat
    for (const modelName of candidateModels) {
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        responseMimeType: "application/json",
                        temperature: 0.9 // Menaikkan kreativitas AI agar tidak monoton
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                lastErrorMessage = `Model ${modelName} Error: ${errData.error?.message || response.statusText}`;
                continue; // Coba model berikutnya jika gagal
            }

            const data = await response.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) {
                lastErrorMessage = `Model ${modelName} mengembalikan respons kosong.`;
                continue;
            }

            rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const firstOpen = rawText.indexOf('{');
            const lastClose = rawText.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                rawText = rawText.substring(firstOpen, lastClose + 1);
            }

            const parsedData = JSON.parse(rawText);
            // KONTROL KUALITAS: Jika kata berhasil didapatkan dari AI, langsung kirim!
            if (parsedData && parsedData.words && parsedData.words.length > 0) {
                return res.status(200).json(parsedData);
            }

        } catch (err) {
            lastErrorMessage = `Fetch Error (${modelName}): ${err.message}`;
        }
    }

    // JIKA SEMUA MODEL GAGAL: Tampilkan Error Aslinya di Layar agar Bisa Kita Perbaiki!
    return res.status(500).json({
        error: "Gagal memanggil AI Gemini.",
        detail: lastErrorMessage,
        activeKeyUsed: activeKey ? `${activeKey.substring(0, 6)}...` : "None"
    });
}
