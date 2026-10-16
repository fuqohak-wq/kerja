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

    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    let requestDate = "";
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (body && body.date) requestDate = body.date;
    } catch (e) {}

    if (!requestDate) requestDate = new Date().toISOString().split('T')[0];
    const dayOfMonth = new Date(requestDate).getDate() || 1;

    const grammarThemes = [
        "Advanced Future Forms & Temporal Clauses",
        "Modal Verbs of Obligation, Deduction, and Speculation",
        "Mixed Conditionals & Alternatives to 'If'",
        "The Subjunctive Mood & Unreal Past",
        "Inversion after Negative Adverbials",
        "Causative Passive & Impersonal Passive",
        "Gerunds vs Infinitives with Meaning Change",
        "Relative Clauses with Prepositions",
        "Cleft Sentences for Emphasis",
        "Double Comparatives and Nuances",
        "Conjunctions of Concession and Contrast",
        "Advanced Article Usage & Noun Rules",
        "Reflexive and Distributive Pronouns",
        "Dependent Prepositions & Complex Phrases",
        "Reported Speech with Advanced Reporting Verbs",
        "Participle Clauses for Concession and Time",
        "Subject-Verb Agreement Exceptions",
        "Advanced Tag Questions",
        "Grammar of Phrasal Verbs",
        "Verb Patterns & Complements",
        "Degree Modifiers & Adverbial Qualifiers",
        "Emphatic Structures & Fronting",
        "Irregular Plurals & Collective Concord",
        "Introductory 'It' vs Existential 'There'",
        "Grammatical Ellipsis & Substitution",
        "Word Formation & Syntactic Shifts",
        "Indirect Questions & Diplomatic Language",
        "Expressing Past Habits (used to vs would)",
        "Adjective Order & Compound Adjectives",
        "Advanced Quantifiers & Distributives",
        "Prepositions in Complex Metaphoric Usages"
    ];

    const activeTheme = grammarThemes[(dayOfMonth - 1) % grammarThemes.length];

    const prompt = `You are a Master English Grammar Educator.
Target Focus: "${activeTheme}".

Generate ONE SINGLE highly-detailed grammar lesson on this topic, followed by 6 quiz questions.

Output MUST be strictly valid JSON without markdown tags, matching this exact structure:
{
  "topic": "${activeTheme}",
  "explanation": "Penjelasan mendalam tentang aturan tata bahasa ini dalam Bahasa Indonesia.",
  "formula": "Rumus / Pola Kalimat Utama",
  "examples": [
    { "en": "Example sentence 1 in English", "id": "Terjemahan bahasa Indonesia" },
    { "en": "Example sentence 2 in English", "id": "Terjemahan bahasa Indonesia" },
    { "en": "Example sentence 3 in English", "id": "Terjemahan bahasa Indonesia" }
  ],
  "usageNotes": "Tips penting / kesalahan umum yang sering dilakukan pembelajar.",
  "quizzes": [
    {
      "question": "Question text in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Penjelasan detail kenapa jawaban ini benar."
    }
  ]
}`;

    let lastError = null;

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
                            temperature: 0.4,
                            responseMimeType: "application/json" 
                        }
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    lastError = errData.error?.message || `HTTP ${response.status}`;
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
                if (parsed.topic && parsed.quizzes) {
                    return res.status(200).json(parsed);
                }

            } catch (err) {
                lastError = err.message;
            }
        }
    }

    // Fallback Lokal Detail jika API offline
    return res.status(200).json({
        topic: activeTheme,
        explanation: "PENGGUNAAN INVERSION: Pembalikan posisi subjek dan auxiliary verb (kata kerja bantu) yang dilakukan ketika kalimat diawali oleh kata keterangan bernada negatif atau terbatas.",
        formula: "Negative Adverb + Auxiliary Verb (do/does/did/have/is) + Subject + Main Verb",
        examples: [
            { en: "Not only did he finish the report, but he also presented it.", id: "Dia tidak hanya menyelesaikan laporan, tetapi juga mempresentasikannya." },
            { en: "Rarely have I seen such a dedicated student.", id: "Jarang sekali saya melihat siswa yang sededikasi itu." },
            { en: "Under no circumstances should you leave the door unlocked.", id: "Dalam kondisi bagaimanapun Anda tidak boleh membiarkan pintu tidak terkunci." }
        ],
        usageNotes: "Ingat! Setelah adverb negatif, pola kalimat berubah seperti bentuk kalimat tanya (auxiliary ditaruh sebelum subjek).",
        quizzes: [
            {
                question: "Hardly _____ the house when it started to rain heavily.",
                options: ["had I left", "I had left", "did I left", "I left"],
                answer: "had I left",
                explanation: "Struktur inversi masa lalu membutuhkan kata bantu 'had' sebelum subjek 'I'."
            },
            {
                question: "Seldom _____ such an inspiring speech.",
                options: ["we hear", "do we hear", "we do hear", "heard we"],
                answer: "do we hear",
                explanation: "Kata 'Seldom' di awal kalimat mewajibkan pemakaian auxiliary verb 'do' sebelum subjek 'we'."
            }
        ]
    });
}
