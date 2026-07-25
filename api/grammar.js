export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [
        process.env.GEMINI_KEY_1, 
        process.env.GEMINI_KEY_2, 
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) return res.status(500).json({ error: "API Key tidak ditemukan." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    // Mengambil tanggal dari body request atau menggunakan tanggal server jika kosong
    let requestDate = "";
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (body && body.date) {
            requestDate = body.date;
        }
    } catch (e) {
        // Abaikan error parsing jika ada
    }

    if (!requestDate) {
        requestDate = new Date().toISOString().split('T')[0];
    }

    // Mendapatkan angka hari (1-31) untuk rotasi tema harian
    const dayOfMonth = new Date(requestDate).getDate() || 1;

    // Daftar 31 tema tata bahasa yang berbeda agar materi bervariasi setiap hari
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
Today's Date: ${requestDate}
Today's Target Theme Focus: ${activeTheme}

Generate a daily batch containing 10 essential Grammar topics and 20 multiple-choice quiz questions.
To ensure variety, focus at least 5 topics and 10 quizzes on today's target theme: "${activeTheme}". The rest can be other intermediate/advanced topics. Avoid repeating basic topics like standard 'Simple Present' or 'Subject Pronouns' unless they involve high-level exceptions.

Output MUST be strictly valid JSON without markdown formatting, matching this exact structure:
{
  "topics": [
    { "topic": "Topic Name", "explanation": "Penjelasan Ringkas Bahasa Indonesia", "formula": "Subject + ..." }
  ],
  "quizzes": [
    {
      "question": "Grammar question text in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Penjelasan aturan tata bahasa."
    }
  ]
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
                throw new Error(errData.error?.message || "Gagal dari API Google");
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
        }
    }

    return res.status(500).json({ error: "Gagal memanggil AI: " + lastError });
}
