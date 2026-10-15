export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    // 1. Ambil Semua Key yang Tersedia
    const keys = [
        process.env.GEMINI_KEY_1, 
        process.env.GEMINI_KEY_2, 
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) return res.status(500).json({ error: "API Keys tidak ditemukan di Environment Variables." });

    // Model resmi dan stabil
    const models = ["gemini-3.5-flash", "gemini-2.5-flash"];

    const bodyData = req.body || {};
    
    const availableThemes = [
        "Space Exploration & Mars Rovers", 
        "Artificial Intelligence in Daily Life", 
        "Ocean Mysteries & Deep Sea Creatures", 
        "The Science of Healthy Sleep", 
        "History of Ancient Egyptian Pyramids", 
        "Sustainable Living & Eco-Friendly Habits", 
        "The Culture of Coffee Around the World", 
        "Benefits of Learning a Second Language",
        "The Evolution of Video Games",
        "Extreme Weather Events & Nature",
        "Famous Modern Architecture",
        "Culinary Traditions in Asia"
    ];

    const selectedTheme = bodyData.theme || availableThemes[Math.floor(Math.random() * availableThemes.length)];
    const seed = Date.now() + "_" + Math.random();

    const prompt = `You are an expert English reading comprehension test creator. Generate an interesting English reading article and exercise tailored to this theme: "${selectedTheme}" (Seed: ${seed}). 
Respond strictly in JSON format matching this schema:
{
  "theme": "${selectedTheme}",
  "paragraph1": "First paragraph (2-3 sentences)",
  "paragraph2": "Second paragraph expanding on the topic",
  "paragraph3": "Third paragraph conclusion",
  "vocabularyMap": {
    "word1": "arti kata 1 dalam Bahasa Indonesia",
    "word2": "arti kata 2 dalam Bahasa Indonesia"
  },
  "question": "Reading comprehension question in English?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Exact matching text of the correct option",
  "explanation": "Penjelasan singkat dalam Bahasa Indonesia"
}`;

    let lastError = null;

    // 2. Loop Failover: Coba Setiap Key dan Setiap Model sampai berhasil
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
                            temperature: 0.7,
                            responseMimeType: "application/json" // Memaksa output berupa JSON murni
                        }
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    lastError = errData.error?.message || `HTTP ${response.status}`;
                    console.warn(`[Failover] Key ...${key.slice(-4)} & Model ${modelName} gagal: ${lastError}`);
                    continue; // Pindah ke kombinasi berikutnya
                }

                const data = await response.json();
                let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!rawText) continue;

                // Pembersihan JSON
                rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
                const firstOpen = rawText.indexOf('{');
                const lastClose = rawText.lastIndexOf('}');
                if (firstOpen !== -1 && lastClose !== -1) {
                    rawText = rawText.substring(firstOpen, lastClose + 1);
                }

                const parsedData = JSON.parse(rawText);
                return res.status(200).json(parsedData);

            } catch (err) {
                lastError = err.message;
                console.warn(`[Reading API Exception] (${modelName}):`, err.message);
            }
        }
    }

    console.error("Semua API Key & Model gagal. Menggunakan fallback lokal:", lastError);

    // 3. Fallback Cadangan jika API mati total
    const fallbackArticles = [
        {
            theme: "Space & Mars",
            paragraph1: "Scientists around the world are studying Mars to understand if human life could ever exist there in the future.",
            paragraph2: "Robotic rovers currently explore the red planet, collecting soil samples and taking high-resolution photographs of its dry landscape.",
            paragraph3: "Discovering evidence of ancient water on Mars suggests that the planet might have been habitated by tiny organisms billions of years ago.",
            vocabularyMap: { "explore": "jelajahi", "evidence": "bukti", "habitated": "dihuni" },
            question: "What are robotic rovers currently collecting on Mars?",
            options: ["Soil samples and photographs", "Alien plants", "Clean drinking water", "Solar panels"],
            answer: "Soil samples and photographs",
            explanation: "Paragraf kedua menyebutkan bahwa rover mengumpulkan sampel tanah (soil samples) dan foto."
        },
        {
            theme: "Artificial Intelligence",
            paragraph1: "Artificial Intelligence is rapidly changing how people work, learn, and communicate in modern society.",
            paragraph2: "Smart algorithms can now assist doctors in diagnosing diseases and help students practice new languages interactively.",
            paragraph3: "However, experts emphasize the importance of using technology responsibly to protect privacy and data security.",
            vocabularyMap: { "diagnosing": "Mendiagnosis", "interactively": "secara interaktif", "emphasize": "menekankan" },
            question: "According to the text, how does AI assist doctors?",
            options: ["In diagnosing diseases", "In building hospitals", "In driving ambulances", "In cooking meals"],
            answer: "In diagnosing diseases",
            explanation: "Paragraf kedua menjelaskan bahwa algoritma AI dapat membantu dokter dalam mendiagnosis penyakit."
        }
    ];

    const randomArticle = fallbackArticles[Math.floor(Math.random() * fallbackArticles.length)];
    return res.status(200).json(randomArticle);
}
