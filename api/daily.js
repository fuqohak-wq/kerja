export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { action, type, currentMaterial } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) return res.status(500).json({ error: "API Key tidak ditemukan di environment variable Vercel." });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        let promptText = "";

        // TAHAP 1: GENERATE MATERI SAJA
        if (action === 'get-material') {
            const seed = Math.random();
            if (type === 'vocab') {
                promptText = `You are a B2-C2 English Cambridge Examiner. Randomly pick a unique theme (e.g., Space, Psychology, Business, Cooking, Maritime, etc. Seed: ${seed}). 
                Generate exactly 10 advanced B2-C2 English words related to that theme. Provide Indonesian meaning and 1 example sentence. 
                Return ONLY a raw JSON code, no markdown block wrappers, strictly matching this structure:
                {"theme": "Theme Name", "words": [{"word": "Word", "meaning": "Arti", "example": "Sentence"}]}`;
            } else {
                promptText = `You are an elite English Syntactician. Randomly select one advanced English grammar topic or sentence structure (e.g., Cleft sentences, Inversion, Mixed Conditionals, Subjunctive, Past Modals, etc. Seed: ${seed}). 
                Explain the rule deeply in Indonesian and provide a clear "Pola/Contoh".
                Return ONLY a raw JSON code, no markdown block wrappers, strictly matching this structure:
                {"topic": "Topic Name", "explanation": "Penjelasan Bahasa Indonesia", "formula": "Pola kalimat / Contoh"}`;
            }
        } 
        // TAHAP 2: GENERATE 5 SOAL BERDASARKAN MATERI YANG SUDAH JADI
        else if (action === 'get-quizzes') {
            promptText = `Based on this learning material: "${JSON.stringify(currentMaterial)}", create exactly 5 challenging multiple-choice questions to reinforce understanding. 
            Vary the question types (sentence completion, error identification). Ensure high quality.
            Return ONLY a raw JSON code, no markdown block wrappers, strictly matching this structure:
            {"quizzes": [
                {"question": "Q1", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q2", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q3", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q4", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"},
                {"question": "Q5", "options": ["A","B","C","D"], "answer": "Correct Option", "explanation": "Why"}
            ]}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: promptText }] }],
                generationConfig: { temperature: 1.0, topP: 0.95 }
            })
        });

        if (!response.ok) throw new Error(`Gemini Error: ${response.status}`);

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        return res.status(200).json(JSON.parse(rawText));

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
