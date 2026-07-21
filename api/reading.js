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
    
    // SISTEM PENGACAK TEMA ARTIKEL
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

    // Jika frontend tidak mengirimkan tema spesifik, pilihkan tema acak
    const selectedTheme = bodyData.theme || availableThemes[Math.floor(Math.random() * availableThemes.length)];
    const seed = Date.now() + "_" + Math.random();

    const prompt = `You are an expert English reading comprehension test creator. Generate an interesting English reading article and exercise tailored to this theme: "${selectedTheme}" (Seed: ${seed}). 
You MUST output ONLY valid JSON format using this exact structure without any markdown backticks or extra text:
{
  "theme": "${selectedTheme}",
  "paragraph1": "First paragraph of the reading article in English (2-3 engaging sentences)...",
  "paragraph2": "Second paragraph expanding on the topic in English...",
  "paragraph3": "Third paragraph providing a conclusion or interesting fact...",
  "vocabularyMap": {
    "keyWord1": "arti kata 1 dalam Bahasa Indonesia",
    "keyWord2": "arti kata 2 dalam Bahasa Indonesia",
    "keyWord3": "arti kata 3 dalam Bahasa Indonesia"
  },
  "question": "Reading comprehension question in English based on the article above?",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "answer": "The exact matching text of the correct option",
  "explanation": "Brief explanation in Bahasa Indonesia why this answer is correct based on the paragraphs."
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

    console.error("Error di API Reading (Pindah ke dynamic fallback):", lastError);

    // ==========================================
    // FALLBACK ARTIKEL BACAAN BERVARIASI
    // ==========================================
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
        },
        {
            theme: "Ocean & Marine Life",
            paragraph1: "The deep ocean remains one of the least explored places on Planet Earth, holding many mysterious creatures.",
            paragraph2: "Because sunlight cannot reach the deepest parts of the sea, many ocean animals create their own light through bioluminescence.",
            paragraph3: "Protecting marine ecosystems from plastic pollution is essential to keep these extraordinary underwater creatures alive.",
            vocabularyMap: { "unexplored": "belum terjelajahi", "bioluminescence": "pendaran hayati (cahaya alami)", "pollution": "pencemaran" },
            question: "Why do some deep sea animals produce their own light?",
            options: ["Because sunlight cannot reach the deepest ocean", "To keep the water warm", "To scare off ships", "To sleep better"],
            answer: "Because sunlight cannot reach the deepest ocean",
            explanation: "Paragraf kedua menyatakan hal ini terjadi karena sinar matahari tidak dapat mencapai bagian laut terdalam."
        }
    ];

    const randomArticle = fallbackArticles[Math.floor(Math.random() * fallbackArticles.length)];
    return res.status(200).json(randomArticle);
}
