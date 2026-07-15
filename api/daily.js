export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.status(200).json(getFallbackData(type));
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // Membuat daftar tema acak agar AI selalu berganti topik bahasan setiap kali dipanggil
        const themes = ["Technology & AI", "Business & Finance", "Psychology & Emotion", "Nature & Science", "Daily Casual & Idioms", "Art & Literature", "Travel & Culture"];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        let promptText = "";
        if (type === 'vocab') {
            promptText = `Act as an advanced English professor. Select 10 highly advanced, diverse, and completely unexpected B2-C1-C2 English vocabulary words focused heavily on the theme: "${randomTheme}". Make sure the words are unique and rarely repeated. For each word, provide the Indonesian meaning and 1 natural example sentence. 
            Also, include 1 challenging multiple choice quiz testing one of those 10 words. 
            Return ONLY a raw JSON code, no markdown block wrappers, strictly matching this structure:
            {"words": [{"word": "Alleviate", "meaning": "Meringankan", "example": "A warm bath can alleviate stress."}], "quiz": {"question": "Meaning of alleviate?", "options": ["To make less severe", "To make worse", "To ignore", "To build"], "answer": "To make less severe", "explanation": "Alleviate means to make less severe."}}`;
        } else {
            promptText = `Select one essential, unique, and random English grammar rules or sentence patterns (ranging from conditional sentences, inversion, passive voice, modal verbs, gerunds, subjunctive, etc.). Pick a topic randomly, avoiding basic tenses. Provide a brief, engaging explanation in Indonesian and a clear formula or example sentence. 
            Include 1 tricky multiple-choice quiz related to this grammar rule.
            Return ONLY a raw JSON code, no markdown block wrappers, strictly matching this structure:
            {"topic": "Topic Name", "explanation": "Penjelasan singkat", "formula": "Formula or Example", "quiz": {"question": "Question", "options": ["A","B","C","D"], "answer": "A", "explanation": "Reason"}}`;
        }

        // Kirim request ke Gemini dengan menambahkan parameter generationConfig untuk kreativitas maksimum (Randomness)
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: promptText }] }],
                generationConfig: {
                    temperature: 1.0,  // Nilai 1.0 memaksa AI untuk sekreatif dan seacak mungkin
                    topP: 0.95,
                    maxOutputTokens: 1500
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error dengan status ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            return res.status(200).json(getFallbackData(type));
        }

        let rawText = data.candidates[0].content.parts[0].text;
        
        // Bersihkan pembungkus blok markdown ```json jika AI tidak sengaja menyertakannya
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedJson = JSON.parse(rawText);
        return res.status(200).json(parsedJson);

    } catch (error) {
        console.error("API Error:", error);
        return res.status(200).json(getFallbackData(req.body.type));
    }
}

// Fungsi Cadangan Lokal dengan variasi acak sederhana jika koneksi internet terputus/kuota habis
function getFallbackData(type) {
    const coinFlip = Math.random() > 0.5;
    if (type === 'vocab') {
        if (coinFlip) {
            return {
                words: [
                    { word: "Alleviate", meaning: "Meringankan", example: "A warm bath can alleviate stress after work." },
                    { word: "Ambiguous", meaning: "Bisa bermakna ganda", example: "His reply was ambiguous, leaving us confused." },
                    { word: "Meticulous", meaning: "Sangat teliti / cermat", example: "She is meticulous about keeping her room clean." },
                    { word: "Pragmatic", meaning: "Praktis / sesuai kenyataan", example: "We need a pragmatic solution to this problem." },
                    { word: "Resilient", meaning: "Cepat pulih / tangguh", example: "The economy proved resilient despite the crisis." }
                ],
                quiz: {
                    question: "Which word means 'sangat teliti'?",
                    options: ["Ambiguous", "Meticulous", "Pragmatic", "Alleviate"],
                    answer: "Meticulous",
                    explanation: "Meticulous artinya sangat teliti atau cermat terhadap detail."
                }
            };
        } else {
            return {
                words: [
                    { word: "Ephemeral", meaning: "Sifatnya sementara / singkat", example: "Fame in the internet age is often ephemeral." },
                    { word: "Eloquent", meaning: "Fasih / pandai berbicara", example: "His eloquent speech moved the entire audience." },
                    { word: "Scrutinize", meaning: "Memeriksa dengan sangat cermat", example: "The manager will scrutinize every detail of the report." },
                    { word: "Superfluous", meaning: "Berlebihan / tidak diperlukan", example: "Avoid writing superfluous details in your essay." },
                    { word: "Vindicate", meaning: "Membersihkan nama baik dari tuduhan", example: "New evidence emerged to vindicate the suspect." }
                ],
                quiz: {
                    question: "What is the meaning of 'Ephemeral'?",
                    options: ["Lasting a very short time", "Extremely beautiful", "Very annoying", "Difficult to understand"],
                    answer: "Lasting a very short time",
                    explanation: "Ephemeral berarti berumur pendek, singkat, atau terjadi hanya sementara."
                }
            };
        }
    } else {
        if (coinFlip) {
            return {
                topic: "Expressing Future Intentions",
                explanation: "Gunakan 'be going to' untuk rencana masa depan yang sudah pasti dibuat sebelum berbicara, atau jika ada bukti kuat saat ini.",
                formula: "Subject + am/is/are + going to + Verb 1 (e.g., We've booked the hotel, so we are going to go on vacation.)",
                quiz: {
                    question: "We've already booked the hotel, so we _______ go on vacation next week.",
                    options: ["will", "are going to", "go", "are going"],
                    answer: "are going to",
                    explanation: "Karena hotel sudah dipesan (rencana sudah matang sebelum dibicarakan), bentuk yang tepat adalah 'are going to'."
                }
            };
        } else {
            return {
                topic: "Inversion for Emphasis",
                explanation: "Inversi adalah pembalikan posisi subjek dan kata kerja bantu (auxiliary verb) setelah ekspresi negatif untuk memberikan penekanan emosi yang kuat.",
                formula: "Negative Expression (Seldom/Rarely/Never) + Auxiliary + Subject + Verb (e.g., Seldom have I seen such a beautiful view.)",
                quiz: {
                    question: "Never _______ witnessed such a chaotic football match in my entire life.",
                    options: ["I have", "have I", "I did", "did I have"],
                    answer: "have I",
                    explanation: "Setelah kata keterangan negatif 'Never' di awal kalimat, susunan kalimat harus diinversi menjadi kata kerja bantu terlebih dahulu: 'have I'."
                }
            };
        }
    }
}
