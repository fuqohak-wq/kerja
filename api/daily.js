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

        // Kumpulan kategori super luas agar AI melompat-lompat topik setiap kali reload
        const vocabCategories = [
            "Idioms & Phrasal Verbs in Corporate World", "Advanced Psychology & Behavioral Terms", 
            "Medical & Scientific Advancements Vocabulary", "Legal & Political Discourse Words", 
            "Art, Philosophy, & Aesthetics Terminology", "Environmental Science & Climate Debate",
            "Modern Technology, AI & Digital Subculture Slang", "Literature & Descriptive Masterpieces"
        ];
        
        const grammarCategories = [
            "Inversion after Negative Adverbs (Hardly, Scrutinized, Not until)", 
            "Mixed Conditionals (Type 2 + Type 3 combination)", 
            "Subjunctive Mood for Urgency or Demands (It is imperative that...)", 
            "Causative Verbs (Have/Get/Make someone do something)", 
            "Advanced Passive Voice (It is said that / Having been seen)", 
            "Gerunds vs Infinitives with complete meaning changes (Stop/Remember/Forget)",
            "Relative Clauses with Prepositions (To whom, In which, Whereby)",
            "Modals of Lost Opportunity or Deduction in Past (Should have, Must have, Needn't have)"
        ];

        const randomVocabTheme = vocabCategories[Math.floor(Math.random() * vocabCategories.length)];
        const randomGrammarTheme = grammarCategories[Math.floor(Math.random() * grammarCategories.length)];

        let promptText = "";
        if (type === 'vocab') {
            promptText = `You are a strict B2-C2 English Cambridge Examiner. 
            1. Select 10 hyper-specific, advanced, and rare English words matching the theme: "${randomVocabTheme}". Provide Indonesian meaning and 1 natural complex example sentence for each.
            2. Create exactly 5 distinct multiple-choice quiz questions to test these words. Ensure questions have different sentences and contexts.
            Return ONLY a raw JSON code, no markdown block wrappers, strictly matching this structure:
            {
              "words": [{"word": "Word", "meaning": "Arti", "example": "Sentence"}],
              "quizzes": [
                {"question": "Q1", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q2", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q3", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q4", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q5", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"}
              ]
            }`;
        } else {
            promptText = `You are an elite English Syntactician.
            1. Focus entirely on the advanced grammar topic: "${randomGrammarTheme}". Explain the rule briefly and deeply in Indonesian. Give a crystal-clear "Pola/Contoh".
            2. Create exactly 5 high-quality, non-repetitive multiple-choice quiz questions explicitly designed to reinforce this specific topic. Vary the question styles (sentence completion, error identification, contextual usage).
            Return ONLY a raw JSON code, no markdown block wrappers, strictly matching this structure:
            {
              "topic": "Topic Name",
              "explanation": "Penjelasan mendalam Bahasa Indonesia",
              "formula": "Pola kalimat / Contoh utama",
              "quizzes": [
                {"question": "Q1", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q2", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q3", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q4", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q5", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"}
              ]
            }`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: promptText }] }],
                generationConfig: {
                    temperature: 1.0, // Kreativitas maksimal agar teks tidak repetitif
                    topP: 0.95,
                    maxOutputTokens: 2500 // Ditambah agar muat menampung 5 soal kuis sekaligus
                }
            })
        });

        if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);

        const data = await response.json();
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            return res.status(200).json(getFallbackData(type));
        }

        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedJson = JSON.parse(rawText);
        return res.status(200).json(parsedJson);

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(200).json(getFallbackData(req.body.type));
    }
}

// Data lokal dinamis jika API mengalami gangguan limitasi
function getFallbackData(type) {
    if (type === 'vocab') {
        return {
            words: [{ word: "Conspicuous", meaning: "Mencolok / Mudah terlihat", example: "The red tower was conspicuous against the sky." }],
            quizzes: Array.from({ length: 5 }, (_, i) => ({
                question: `[Latihan ${i+1}] What is the antonym of Conspicuous?`,
                options: ["Hidden", "Obvious", "Bright", "Clear"],
                answer: "Hidden",
                explanation: "Conspicuous berarti mencolok, kebalikannya adalah tersembunyi (Hidden)."
            }))
        };
    } else {
        return {
            topic: "Inversion",
            explanation: "Pembalukan kata kerja bantu ke depan subjek setelah ekspresi negatif.",
            formula: "Seldom / Rarely + Auxiliary + Subject + Verb",
            quizzes: Array.from({ length: 5 }, (_, i) => ({
                question: `[Latihan ${i+1}] Seldom _______ such a breathtaking sunset.`,
                options: ["have I seen", "I have seen", "did I saw", "I saw"],
                answer: "have I seen",
                explanation: "Aturan inversi mengharuskan kata bantu 'have' mendahului subjek 'I'."
            }))
        };
    }
}
