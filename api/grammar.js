export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    // 1. Kumpulkan semua API Key yang tersedia
    const keys = [
        process.env.GEMINI_KEY_1, 
        process.env.GEMINI_KEY_2, 
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) return res.status(500).json({ error: "API Key tidak ditemukan di Environment Variables." });

    // Model resmi dan teruji
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    let requestDate = "";
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (body && body.date) {
            requestDate = body.date;
        }
    } catch (e) {}

    if (!requestDate) {
        requestDate = new Date().toISOString().split('T')[0];
    }

    const dayOfMonth = new Date(requestDate).getDate() || 1;

    const grammarThemes = [
        "Advanced Future Forms & Temporal Clauses (Future Perfect, Future in the Past)",
        "Modal Verbs of Obligation, Deduction, and Speculation (must have, should have, might have)",
        "Mixed Conditionals & Alternatives to 'If' (provided that, assuming, had it not been for)",
        "The Subjunctive Mood & Unreal Past (wish, would rather, it's high time)",
        "Inversion after Negative Adverbials (Not only..., Little did he know...)",
        "Causative Passive (have/get something done) & Impersonal Passive (It is said that...)",
        "Gerunds vs Infinitives with meaning change (stop, remember, forget, regret, try)",
        "Relative Clauses with Prepositions & Nominal Relative Clauses (whom, whereby, whatever)",
        "Cleft Sentences (It-clefts, Wh-clefts for emphasis)",
        "Comparison Nuances & Double Comparatives (the more... the more...)",
        "Conjunctions of Concession, Contrast, and Purpose (albeit, whereas, lest, in order that)",
        "Advanced Article Usage & Abstract/Noun Countability rules",
        "Reflexive, Reciprocal, and Distributive Pronouns (each other, one another, each/every)",
        "Dependent Prepositions & Complex Prepositional Phrases (with a view to, in accordance with)",
        "Reported Speech with Advanced Reporting Verbs (insisted on, accused of, denied)",
        "Participle Clauses for Concession, Reason, and Time (Having finished..., Viewed from this angle...)",
        "Subject-Verb Agreement Exceptions (collective nouns, fractional expressions, relative clauses)",
        "Tag Questions with Imperatives, Let's, and Negative Words (nobody, barely)",
        "Grammar of Phrasal Verbs (separable/inseparable, transitive/intransitive dynamics)",
        "Complements & Verb Patterns (verbs followed by bare infinitive, gerund, or participle)",
        "Degree Modifiers & Adverbial Qualifiers (quite, rather, fairly, somewhat)",
        "Emphatic Structures & Fronting (Do/did for positive emphasis, fronting adjectives)",
        "Irregular Plurals & Collective Noun Concord (criteria, phenomena, media)",
        "Introductory 'It' vs Existential 'There' (there being, it seems that)",
        "Grammatical Ellipsis & Substitution (using auxiliary verbs, so/not, one/ones to avoid repetition)",
        "Word Formation & Syntactic Category Shifts (nominalization, prefix/suffix grammar)",
        "Indirect Questions, Softeners, and Diplomatic/Polite Language Structures",
        "Expressing Past Habits & Changes (used to vs would vs get used to)",
        "Adjective Order, Participle Adjectives (boring vs bored), and Compound Adjectives",
        "Advanced Quantifiers & Distributives (both, neither, either, none, all, whole)",
        "Prepositions of Place, Direction, and Time in complex metaphoric usages"
    ];

    const activeTheme = grammarThemes[(dayOfMonth - 1) % grammarThemes.length];

    const prompt = `You are a professional English AI Tutor.
Today's Target Focus: ${activeTheme}

Generate a concise grammar module containing 4 core Grammar topics and 6 multiple-choice quiz questions focusing on "${activeTheme}".

Output MUST be strictly valid JSON without markdown tags, matching this exact structure:
{
  "topics": [
    { "topic": "Topic Name", "explanation": "Penjelasan Ringkas Bahasa Indonesia", "formula": "Subject + ..." }
  ],
  "quizzes": [
    {
      "question": "Grammar question text in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Penjelasan aturan tata bahasa dalam Bahasa Indonesia."
    }
  ]
}`;

    let lastError = null;

    // 2. Loop Failover: Coba Setiap Key dan Setiap Model
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
                    console.warn(`[Grammar Failover] Key ...${key.slice(-4)} & Model ${modelName} gagal: ${lastError}`);
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
                if (parsed.topics && parsed.quizzes) {
                    return res.status(200).json(parsed);
                }

            } catch (err) {
                lastError = err.message;
                console.warn(`[Grammar API Exception] (${modelName}):`, err.message);
            }
        }
    }

    console.error("Semua API Key Grammar gagal. Menggunakan fallback lokal:", lastError);

    // 3. Fallback Lokal Cadangan
    return res.status(200).json({
        topics: [
            {
                topic: "Modal Verbs of Speculation (Past)",
                explanation: "Digunakan untuk mengandai-andai atau menebak kejadian di masa lalu berdasarkan bukti yang ada.",
                formula: "Subject + must/might/could/should + have + Verb 3"
            },
            {
                topic: "Inversion after Negative Adverbs",
                explanation: "Pembalikan posisi subjek dan kata kerja bantu setelah kata keterangan negatif untuk memberikan penekanan.",
                formula: "Negative Adverb (Not only/Hardly) + Auxiliary Verb + Subject + Main Verb"
            }
        ],
        quizzes: [
            {
                question: "She _____ arrived by now; her flight landed two hours ago.",
                options: ["must have", "should be", "might had", "can have"],
                answer: "must have",
                explanation: "Menggunakan 'must have + V3' untuk menyatakan kepastian/kesimpulan kuat tentang kejadian masa lalu."
            },
            {
                question: "Not only _____ the exam, but he also got the top score in class.",
                options: ["he passed", "did he pass", "he did pass", "passed he"],
                answer: "did he pass",
                explanation: "Struktur inversi membutuhkan kata kerja bantu 'did' sebelum subjek 'he'."
            }
        ]
    });
}
