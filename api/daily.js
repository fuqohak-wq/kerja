// Memastikan kompatibilitas baik untuk SDK baru (@google/genai) maupun SDK lama (@google/generative-ai)
import { GoogleGenAI } from '@google/genai'; 

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
    // Mengambil 3 kunci berbeda yang sudah Anda daftarkan di Environment Variables Vercel
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(Boolean); // Menyaring agar key yang kosong/tidak diisi tidak ikut terbawa

    if (keys.length === 0) {
        return res.status(500).json({ 
            error: "API Keys tidak ditemukan. Pastikan Anda sudah mengisi GEMINI_KEY_1, GEMINI_KEY_2, atau GEMINI_KEY_3 di Vercel." 
        });
    }

    // Memilih salah satu kunci secara acak setiap kali ada request masuk
    const activeKey = keys[Math.floor(Math.random() * keys.length)];

    let ai;
    try {
        // Inisialisasi menggunakan standar SDK Terbaru
        ai = new GoogleGenAI({ apiKey: activeKey }); 
    } catch (e) {
        // PERBAIKAN: Jika Vercel Anda menggunakan SDK Lama, baris ini akan menyelamatkannya agar tidak error validasi lagi
        return res.status(500).json({ 
            error: "Gagal inisialisasi SDK. Jika Anda menggunakan library '@google/generative-ai' lama, ubah inisialisasi menjadi GoogleGenerativeAI." 
        });
    }

    const { action, type } = req.body;

    // 3. STRATEGI BULK GENERATION (50 MATERI SEKALIGUS)
    if (action === 'get-material-bulk') {
        try {
            let prompt = "";
            if (type === 'vocab') {
                prompt = `Generate exactly 50 English vocabulary learning materials. Return JSON format strictly as an array of objects: [{"theme": "Everyday Conversation", "words": [{"word": "Persist", "meaning": "Bertahan/Tegar", "example": "You must persist in your studies."}]}]`;
            } else {
                prompt = `Generate exactly 50 English grammar booster materials. Return JSON format strictly as an array of objects: [{"topic": "Simple Past Tense", "explanation": "Used to talk about completed actions in the past.", "formula": "Subject + Verb 2"}]`;
            }

            // Memanggil model Gemini untuk membuat 50 data langsung
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { 
                    responseMimeType: "application/json" 
                }
            });

            // Mengirimkan data kembali ke frontend
            const bulkData = JSON.parse(response.text);
            return res.status(200).json(bulkData);

        } catch (err) {
            console.error("Error Bulk Gen:", err);
            return res.status(500).json({ error: `Gagal generate materi: ${err.message}` });
        }
    }

    // 4. API PENGAMBILAN KUIS BERDASARKAN MATERI YANG TERPILIH
    if (action === 'get-quizzes') {
        try {
            const { currentMaterial } = req.body;
            const prompt = `Based on this English learning material: ${JSON.stringify(currentMaterial)}, generate exactly 5 multiple choice questions to test the user. Return JSON format strictly: {"quizzes": [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "correct option string", "explanation": "..."}]}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { 
                    responseMimeType: "application/json" 
                }
            });

            return res.status(200).json(JSON.parse(response.text));

        } catch (err) {
            console.error("Error Quiz Gen:", err);
            return res.status(500).json({ error: `Gagal generate kuis: ${err.message}` });
        }
    }
}
