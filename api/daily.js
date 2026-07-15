export default async function handler(req, res) {
    // Pengaturan Header CORS
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

        let promptText = type === 'vocab' 
            ? "Create 10 advanced B2-C1 English vocabulary words. Provide Indonesian meaning and 1 example sentence. Include 1 multiple choice quiz related to them. Return ONLY a raw JSON code, no markdown block wrappers, strictly matching this structure: {\"words\": [{\"word\": \"Alleviate\", \"meaning\": \"Meringankan\", \"example\": \"A warm bath can alleviate stress.\"}], \"quiz\": {\"question\": \"Meaning of alleviate?\", \"options\": [\"To make less severe\", \"To make worse\", \"To ignore\", \"To build\"], \"answer\": \"To make less severe\", \"explanation\": \"Alleviate means to make less severe.\"}}"
            : "Create 1 essential random English grammar topic. Provide brief explanation in Indonesian and formula/example sentence. Include 1 multiple choice quiz. Return ONLY a raw JSON code, no markdown block wrappers, strictly matching this structure: {\"topic\": \"Topic Name\", \"explanation\": \"Penjelasan singkat\", \"formula\": \"Formula or Example\", \"quiz\": {\"question\": \"Question\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"answer\": \"A\", \"explanation\": \"Reason\"}}";

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: promptText }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API responded with status ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            return res.status(200).json(getFallbackData(type));
        }

        let rawText = data.candidates[0].content.parts[0].text;
        
        // Pembersihan jika AI mengembalikan markdown box ```json
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Validasi JSON sebelum dikirim ke frontend
        const parsedJson = JSON.parse(rawText);
        return res.status(200).json(parsedJson);

    } catch (error) {
        console.error("API Error:", error);
        // Jika AI gagal/lama merespons, kirim data lokal instan agar user tidak melihat error zonk
        return res.status(200).json(getFallbackData(req.body.type));
    }
}

// Fungsi Cadangan jika AI Sibuk / Kuota Habis
function getFallbackData(type) {
    if (type === 'vocab') {
        return {
            words: [
                { word: "Alleviate", meaning: "Meringankan", example: "A warm bath can alleviate stress after work." },
                { word: "Ambiguous", meaning: "Bisa bermakna ganda / tidak jelas", example: "His reply was ambiguous, leaving us confused." },
                { word: "Meticulous", meaning: "Sangat teliti / cermat", example: "She is meticulous about keeping her room clean." },
                { word: "Pragmatic", meaning: "Praktis / sesuai kenyataan", example: "We need a pragmatic solution to this problem." },
                { word: "Resilient", meaning: "Cepat pulih / tangguh", example: "The local economy proved resilient despite the crisis." }
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
            topic: "Expressing Future Intentions",
            explanation: "Gunakan 'be going to' untuk rencana masa depan yang sudah pasti dibuat sebelum berbicara, atau jika ada bukti kuat saat ini.",
            formula: "Subject + am/is/are + going to + Verb 1 (e.g., We've booked the hotel, so we are going to go on vacation.)",
            quiz: {
                question: "We've already booked the hotel, so we _______ go on vacation next week.",
                options: ["will", "are going to", "go", "are going"],
                answer: "are going to",
                explanation: "Karena hotel sudah dipesan (sudah ada rencana pasti), gunakan 'are going to'."
            }
        };
    }
}
