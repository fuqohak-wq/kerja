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

    // 2. ROTASI MULTI-KEY SECARA ACAK (Biar Speaking & Report ikut lancar)
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ 
            error: "API Keys tidak ditemukan di backend /api/chat. Pastikan GEMINI_KEY_1/2/3 terisi di Vercel." 
        });
    }

    // Pilih salah satu kunci aktif secara acak
    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

    const { message, history, roleplay, level, isFinalReport } = req.body;

    try {
        let prompt = "";
        let requestBody = {};

        if (isFinalReport) {
            // MODE A: MEMBUAT LAPORAN EVALUASI AKHIR SPEAKING
            prompt = `You are an expert English examiner. Based on this chat history: ${JSON.stringify(history)}, generate a comprehensive final speaking evaluation report for a student learning at ${level} level. 
            Return JSON format strictly:
            {
              "overall": 85,
              "fluency": 80,
              "grammar": 85,
              "pronunciation": 90,
              "vocabulary": 85,
              "mistakes": [
                {"user": "wrong sentence used by user", "correct": "the correct professional English way", "explanation": "why it is wrong"}
              ]
            }`;

            requestBody = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            };
        } else {
            // MODE B: PERCAKAPAN ROLEPLAY BIASA (CHAT DENGAN AI)
            // Menyusun riwayat chat agar dipahami oleh API REST Gemini
            const contents = [];
            
            // Masukkan instruksi sistem di awal percakapan
            contents.push({
                role: 'user',
                parts: [{ text: `System Instruction: Act as a helpful and engaging roleplay partner. Your role is: ${roleplay}. Keep your responses clear, natural, and suitable for a learner at ${level} level. Answer the user now.` }]
            });

            // Rekonstruksi history chat sebelumnya
            if (history && history.length > 0) {
                history.forEach(chat => {
                    contents.push({
                        role: chat.role === 'user' ? 'user' : 'model',
                        parts: [{ text: chat.text }]
                    });
                });
            }

            // Masukkan pesan terbaru dari user
            contents.push({
                role: 'user',
                parts: [{ text: message }]
            });

            requestBody = { contents };
        }

        // Tembak langsung ke REST API
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Gagal merespon dari Google API");
        }

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;

        if (isFinalReport) {
            // Kembalikan objek laporan utuh
            return res.status(200).json(JSON.parse(rawText));
        } else {
            // Kembalikan format balasan teks biasa
            return res.status(200).json({ reply: rawText });
        }

    } catch (err) {
        console.error("Error di API Chat:", err);
        return res.status(500).json({ error: `Gagal memproses sesi speaking: ${err.message}` });
    }
}
