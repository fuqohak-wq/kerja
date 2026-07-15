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
            error: "API Keys tidak ditemukan di backend /api/chat. Pastikan GEMINI_KEY_1/2/3 terisi di Vercel." 
        });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

    const { message, history, roleplay, level, isFinalReport } = req.body;

    try {
        let requestBody = {};

        if (isFinalReport) {
            // MODE A: MEMBUAT LAPORAN EVALUASI AKHIR SPEAKING (Gunakan petunjuk bahasa Indonesia untuk laporan agar mudah Anda pahami)
            const prompt = `You are an expert English examiner. Based on this chat history: ${JSON.stringify(history)}, generate a comprehensive final speaking evaluation report for a student learning at ${level} level. 
            The explanation MUST be written in Bahasa Indonesia so the student can understand their mistakes easily.
            Return JSON format strictly:
            {
              "overall": 85,
              "fluency": 80,
              "grammar": 85,
              "pronunciation": 90,
              "vocabulary": 85,
              "mistakes": [
                {"user": "wrong sentence used by user", "correct": "the correct professional English way", "explanation": "penjelasan detail dalam Bahasa Indonesia mengenai letak kesalahan tata bahasa atau pelafalannya"}
              ]
            }`;

            requestBody = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            };
        } else {
            // MODE B: PERCAKAPAN ROLEPLAY BIASA (CHAT DENGAN AI)
            const contents = [];
            
            // PERBAIKAN UTAMA: Kami perketat instruksi sistem agar AI wajib berbicara Bahasa Inggris penuh!
            contents.push({
                role: 'user',
                parts: [{ text: `System Instruction: You are an English speaking partner. You must speak ONLY in English. Do NOT translate your responses to Indonesian. Do NOT use Indonesian under any circumstances. Your current roleplay character is: "${roleplay}". Keep your responses short, natural, engaging, and highly suitable for an English learner at "${level}" level. Limit your response to a maximum of 2 or 3 short sentences so it feels like a real phone call. Start the conversation now based on your role.` }]
            });

            // Rekonstruksi riwayat chat sebelumnya
            if (history && history.length > 0) {
                history.forEach(chat => {
                    contents.push({
                        role: chat.role === 'user' ? 'user' : 'model',
                        parts: [{ text: chat.text || chat.message || "" }]
                    });
                });
            }

            // Masukkan pesan terbaru dari user
            if (message && message !== "Hello, let's start the conversation.") {
                contents.push({
                    role: 'user',
                    parts: [{ text: message }]
                });
            }

            requestBody = { contents };
        }

        // Tembak ke REST API Google Gemini
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
        let rawText = data.candidates[0].content.parts[0].text;

        if (isFinalReport) {
            // Bersihkan teks dari bungkus markdown ```json ... ``` jika ada
            rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            return res.status(200).json(JSON.parse(rawText));
        } else {
            // Kembalikan format balasan teks biasa ke frontend
            return res.status(200).json({ reply: rawText.trim() });
        }

    } catch (err) {
        console.error("Error di API Chat:", err);
        return res.status(500).json({ error: `Gagal memproses sesi speaking: ${err.message}` });
    }
}
