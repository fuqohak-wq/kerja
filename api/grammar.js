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
        prompt = `Based on this grammar material/topic: ${JSON.stringify(currentMaterial || {})}, generate EXACTLY 5 multiple choice grammar questions.
Output MUST be strictly in valid JSON format matching this structure:
{
  "quizzes": [
    {
      "question": "Grammar fill-in-the-blank or identification question in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Exact matching string of correct option",
      "explanation": "Penjelasan aturan tata bahasa dalam Bahasa Indonesia."
    }
  ]
}`;
    } else {
        // Default / get-material-bulk: Minta 5 Topik Grammar Harian
        prompt = `Generate 5 essential English grammar topics for daily learning.
Output MUST be strictly a valid JSON array matching this structure:
[
  {
    "topic": "Grammar Topic Name (e.g. Simple Present, Present Perfect)",
    "explanation": "Penjelasan ringkas dalam Bahasa Indonesia",
    "formula": "Rumus Kalimat (Subject + Verb ...)"
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
            console.warn(`Grammar API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error Grammar API:", lastError);

    // Fallback jika API terbentur limit
    if (action === 'get-quizzes') {
        return res.status(200).json({
            quizzes: [
                { question: "She _____ to school every day.", options: ["walks", "walked", "walking", "walk"], answer: "walks", explanation: "Subjek 'She' pada Simple Present Tense membutuhkan akhiran -s pada katakerja." },
                { question: "They _____ finished their homework.", options: ["have", "has", "is", "was"], answer: "have", explanation: "Present Perfect Tense untuk subjek 'They' menggunakan auxiliary verb 'have'." },
                { question: "Look! It _____ outside.", options: ["is raining", "rained", "rains", "was rain"], answer: "is raining", explanation: "Kejadian yang sedang berlangsung saat bicara menggunakan Present Continuous Tense (is + V-ing)." },
                { question: "Yesterday, I _____ a new book.", options: ["bought", "buy", "buying", "buys"], answer: "bought", explanation: "Keterangan waktu 'Yesterday' menandakan penggunaan Simple Past Tense (Verb 2)." },
                { question: "If it rains tomorrow, we _____ at home.", options: ["will stay", "stayed", "staying", "stays"], answer: "will stay", explanation: "First Conditional Sentence menggunakan Simple Present di klausa 'if' dan 'will + V1' di main clause." }
            ]
        });
    }

    return res.status(200).json([
        { topic: "Simple Present Tense", explanation: "Digunakan untuk kebiasaan sehari-hari atau fakta umum.", formula: "Subject + Verb 1 (-s/-es) + Object" },
        { topic: "Present Continuous Tense", explanation: "Menerangkan kejadian yang sedang berlangsung saat ini.", formula: "Subject + am/is/are + Verb-ing" },
        { topic: "Simple Past Tense", explanation: "Menerangkan kejadian yang sudah selesai di masa lalu.", formula: "Subject + Verb 2 + Object" },
        { topic: "Present Perfect Tense", explanation: "Menyatakan kejadian yang telah terjadi dan ada hubungannya dengan sekarang.", formula: "Subject + have/has + Verb 3" },
        { topic: "Future Tense (Will)", explanation: "Menyatakan keputusan spontaneous atau rencana di masa depan.", formula: "Subject + will + Verb 1" }
    ]);
}
