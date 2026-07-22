export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean);
    if (keys.length === 0) return res.status(500).json({ error: "API Keys tidak ditemukan." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const modelName = "gemini-1.5-flash";

    const prompt = `You are an expert English Grammar AI Tutor.
Generate 3 distinct essential English grammar topics AND 5 multiple-choice quiz questions testing those topics.

OUTPUT MUST BE STRICTLY VALID JSON (NO MARKDOWN CODEBLOCKS) MATCHING THIS EXACT STRUCTURE:
{
  "topics": [
    { "topic": "Grammar Topic Name", "explanation": "Penjelasan ringkas Bahasa Indonesia.", "formula": "Subject + Verb ..." }
  ],
  "quizzes": [
    {
      "question": "Grammar question in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Penjelasan tata bahasa dalam Bahasa Indonesia."
    }
  ]
}`;

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
            throw new Error(errData.error?.message || "Response Not OK from Gemini");
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
        console.error("Error Grammar Gemini API:", err.message);
        return res.status(200).json({
            topics: [
                { topic: "Simple Present Tense", explanation: "Digunakan untuk kebiasaan sehari-hari.", formula: "Subject + Verb 1 (-s/-es)" },
                { topic: "Simple Past Tense", explanation: "Digunakan untuk kejadian masa lalu.", formula: "Subject + Verb 2" }
            ],
            quizzes: [
                { question: "She _____ to school every day.", options: ["walks", "walked", "walking", "walk"], answer: "walks", explanation: "Subjek 'She' membutuhkan akhiran -s." }
            ]
        });
    }
}
