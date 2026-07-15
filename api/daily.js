import { GoogleGenAI } from '@google/genai'; // atau pustaka Gemini SDK yang Anda pakai

export default async function handler(req, res) {
    // 1. ROTASI MULTI-KEY SECARA ACAK
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ error: "API Keys belum dikonfigurasi di Vercel." });
    }
    const activeKey = keys[Math.floor(Math.random() * keys.length)];

    // Inisialisasi AI dengan Kunci yang terpilih
    const ai = new GoogleGenAI({ apiKey: activeKey }); 

    const { action, type } = req.body;

    // 2. STRATEGI BULK GENERATION (50 MATERI SEKALIGUS)
    if (action === 'get-material-bulk') {
        try {
            let prompt = "";
            if (type === 'vocab') {
                prompt = `Generate exactly 50 English vocabulary materials. Return JSON format strictly as an array of objects: [{"theme": "...", "words": [{"word": "...", "meaning": "...", "example": "..."}]}]`;
            } else {
                prompt = `Generate exactly 50 English grammar booster materials. Return JSON format strictly as an array of objects: [{"topic": "...", "explanation": "...", "formula": "..."}]`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const bulkData = JSON.parse(response.text);
            return res.status(200).json(bulkData);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // 3. API PENGAMBILAN 5 KUIS DARI MATERI TERPILIH
    if (action === 'get-quizzes') {
        try {
            const { currentMaterial } = req.body;
            const prompt = `Based on this material: ${JSON.stringify(currentMaterial)}, generate exactly 5 multiple choice questions. Return JSON format strictly: {"quizzes": [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "correct option string", "explanation": "..."}]}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            return res.status(200).json(JSON.parse(response.text));
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}
