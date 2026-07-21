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
    
    // KUNCI PERUBAHAN: Sisipkan kata kunci acak & timestamp agar AI selalu membuat kosakata baru!
    const randomThemes = ["Technology", "Emotion & Feelings", "Nature & Environment", "Cooking & Food", "Travel & Adventure", "Business & Finance", "Art & Music", "Health & Fitness", "Social Media", "Science"];
    const pickedTheme = randomThemes[Math.floor(Math.random() * randomThemes.length)];
    const seed = Date.now() + "_" + Math.random();

    let prompt = "";

    if (action === 'get-quizzes') {
        prompt = `Based on this vocabulary material: ${JSON.stringify(currentMaterial || {})}, generate EXACTLY 5 unique multiple choice quiz questions (Seed: ${seed}).
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
        // Minta 5 Vocabulary baru dengan Tema Acak
        prompt = `Generate 5 fresh and diverse English vocabulary words related to the theme "${pickedTheme}" for English learners (Seed: ${seed}).
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

            const parsed = JSON.parse(rawText);
            return res.status(200).json(parsed);

        } catch (err) {
            lastError = err.message;
            console.warn(`Vocab API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error Vocab API (Pindah ke dynamic fallback):", lastError);

    // ==========================================
    // FALLBACK BERVARIASI (Agar tidak sama saat API error)
    // ==========================================
    if (action === 'get-quizzes') {
        const quizSets = [
            [
                { question: "Apa arti dari kata 'Resilient'?", options: ["Tangguh / Ulet", "Lemah", "Mudah Menyerah", "Ragu-ragu"], answer: "Tangguh / Ulet", explanation: "Resilient berarti memiliki kemampuan untuk bangkit kembali dari kesulitan." },
                { question: "Manakah contoh penggunaan 'Innovate' yang tepat?", options: ["We need to innovate our products.", "She innovate to sleep.", "They innovate apple.", "He is innovate yesterday."], answer: "We need to innovate our products.", explanation: "Innovate adalah kata kerja yang berarti menciptakan perubahan atau pembaruan." },
                { question: "Sinonim dari kata 'Abundant' adalah...", options: ["Plentiful (Melimpah)", "Scarce (Langka)", "Tiny", "Empty"], answer: "Plentiful (Melimpah)", explanation: "Abundant bermakna tersedia dalam jumlah yang sangat banyak." },
                { question: "Apa arti dari kata 'Meticulous'?", options: ["Sangat teliti", "Ceroboh", "Lambat", "Pengancam"], answer: "Sangat teliti", explanation: "Meticulous berarti sangat memperhatikan detail kecil secara cermat." },
                { question: "Pilih kata yang tepat: 'His speech was very _____.'", options: ["Inspiring", "Inspire", "Inspiration", "Inspiredly"], answer: "Inspiring", explanation: "Kata sifat (adjective) 'Inspiring' tepat untuk menerangkan pidato (speech)." }
            ],
            [
                { question: "Apa arti dari kata 'Persist'?", options: ["Gigih / Bertahan", "Berhenti", "Lari", "Menolak"], answer: "Gigih / Bertahan", explanation: "Persist artinya terus melanjutkan usaha meskipun ada kendala." },
                { question: "Apa arti dari 'Fascinating'?", options: ["Sangat menarik", "Membosankan", "Menakutkan", "Biasa saja"], answer: "Sangat menarik", explanation: "Fascinating digunakan untuk menggambarkan sesuatu yang sangat memikat perhatian." },
                { question: "Pilih kata yang benar: 'They made a huge _____.'", options: ["Discovery", "Discover", "Discovering", "Discovered"], answer: "Discovery", explanation: "Discovery (kata benda) berarti penemuan." },
                { question: "Lawan kata dari 'Versatile' (serba bisa) adalah...", options: ["Limited", "Flexible", "Adaptable", "Talented"], answer: "Limited", explanation: "Versatile berarti luwes/multi-bisa, lawan katanya terbatas (limited)." },
                { question: "Apa arti kata 'Empathy'?", options: ["Empati / Rasa peduli", "Kemarahan", "Iri hati", "Ketakutan"], answer: "Empathy", explanation: "Empathy adalah kemampuan memahami perasaan orang lain." }
            ]
        ];
        const randomQuizSet = quizSets[Math.floor(Math.random() * quizSets.length)];
        return res.status(200).json({ quizzes: randomQuizSet });
    }

    // Paket Kosakata Cadangan yang Bervariasi
    const materialSets = [
        [
            { theme: "Technology", word: "Algorithm", meaning: "Algoritma / Langkah logis", example: "The social media algorithm shows content you like." },
            { theme: "Technology", word: "Bandwidth", meaning: "Kapasitas transfer data", example: "Video streaming requires high bandwidth." },
            { theme: "Technology", word: "Encrypted", meaning: "Tersandi / Terlindungi", example: "Your messages are end-to-end encrypted." },
            { theme: "Technology", word: "Interface", meaning: "Antarmuka tampilan", example: "The app has a user-friendly interface." },
            { theme: "Technology", word: "Optimize", meaning: "Optimalkan / Maksimalkan", example: "We need to optimize the system speed." }
        ],
        [
            { theme: "Emotions", word: "Ecstatic", meaning: "Sangat gembira / Sangat senang", example: "She was ecstatic when she passed the exam." },
            { theme: "Emotions", word: "Apprehensive", meaning: "Cemas / Khawatir", example: "He felt apprehensive before the job interview." },
            { theme: "Emotions", word: "Compassionate", meaning: "Penuh kasih sayang / Empati", example: "A good leader is always compassionate." },
            { theme: "Emotions", word: "Overwhelmed", meaning: "Kewalahan / Terlalu banyak beban", example: "Don't feel overwhelmed by your big goals." },
            { theme: "Emotions", word: "Serene", meaning: "Tenang / Damai", example: "The lake looked beautiful and serene in the morning." }
        ],
        [
            { theme: "Travel", word: "Itinerary", meaning: "Rencana perjalanan / Jadwal tur", example: "Check our travel itinerary for tomorrow." },
            { theme: "Travel", word: "Destination", meaning: "Destinasi / Tempat tujuan", example: "Bali is a popular vacation destination." },
            { theme: "Travel", word: "Accommodation", meaning: "Akomodasi / Penginapan", example: "Hotel accommodation is included in the price." },
            { theme: "Travel", word: "Picturesque", meaning: "Indah seperti lukisan", example: "We visited a picturesque mountain village." },
            { theme: "Travel", word: "Hospitality", meaning: "Keramahan layanan", example: "Indonesian people are famous for their hospitality." }
        ]
    ];

    const randomMaterialSet = materialSets[Math.floor(Math.random() * materialSets.length)];
    return res.status(200).json(randomMaterialSet);
}
