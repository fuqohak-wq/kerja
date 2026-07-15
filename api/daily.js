export default async function handler(req, res) {
    // 1. Atur Header CORS agar aman dari pemblokiran browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode tidak diizinkan.' });
    }

    // 2. ROTASI MULTI-KEY SECARA ACAK
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ 
            error: "API Keys tidak ditemukan. Pastikan Anda sudah mengisi GEMINI_KEY_1, GEMINI_KEY_2, atau GEMINI_KEY_3 di Environment Variables Vercel." 
        });
    }

    // Pilih salah satu kunci aktif secara acak
    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    
    // Tembak langsung ke Endpoint REST API resmi milik Google Gemini
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

    const { action, type, currentMaterial } = req.body;

    // 3. STRATEGI BULK GENERATION (50 MATERI SEKALIGUS)
    if (action === 'get-material-bulk') {
        try {
            let prompt = "";
            if (type === 'vocab') {
                prompt = `Generate exactly 50 English vocabulary learning materials. Return JSON format strictly as an array of objects: [{"theme": "Everyday Conversation", "words": [{"word": "Persist", "meaning": "Bertahan/Tegar", "example": "You must persist in your studies."}]}]`;
            } else {
                prompt = `Generate exactly 50 English grammar booster materials. Return JSON format strictly as an array of objects: [{"topic": "Simple Past Tense", "explanation": "Used to talk about completed actions in the past.", "formula": "Subject + Verb 2"}]`;
            }

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
                throw new Error(errData.error?.message || "Gagal merespon dari Google API");
            }

            const data = await response.json();
            const rawText = data.candidates[0].content.parts[0].text;
            
            return res.status(200).json(JSON.parse(rawText));

        } catch (err) {
            console.error("Error Bulk Gen:", err);
            return res.status(500).json({ error: `Gagal generate materi: ${err.message}` });
        }
    }

    // 4. API PENGAMBILAN KUIS BERDASARKAN MATERI YANG TERPILIH
    if (action === 'get-quizzes') {
        try {
            const prompt = `Based on this English learning material: ${JSON.stringify(currentMaterial)}, generate exactly 5 multiple choice questions to test the user. Return JSON format strictly: {"quizzes": [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "correct option string", "explanation": "..."}]}`;
            
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
                throw new Error(errData.error?.message || "Gagal merespon dari Google API");
            }

            const data = await response.json();
            const rawText = data.candidates[0].content.parts[0].text;

            return res.status(200).json(JSON.parse(rawText));

        } catch (err) {
            console.error("Error Quiz Gen:", err);
            return res.status(500).json({ error: `Gagal generate kuis: ${err.message}` });
        }
    }
}
