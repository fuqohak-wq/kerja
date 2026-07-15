export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode tidak diizinkan.' });
    }

    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ 
            error: "API Keys tidak ditemukan di backend /api/chat." 
        });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

    const { message, history } = req.body;

    try {
        // Menyusun riwayat percakapan agar AI merespon sebagai partner speaking interaktif
        let contents = [];
        
        if (history && Array.isArray(history)) {
            history.forEach(h => {
                contents.push({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.parts }]
                });
            });
        }

        // Tambahkan pesan terbaru dari pengguna
        contents.push({
            role: 'user',
            parts: [{ text: message || "Hello" }]
        });

        const systemInstruction = "You are a friendly English speaking practice partner. Keep your response natural, conversational, concise (2-3 sentences), and occasionally ask a follow-up question to keep the conversation going in English.";

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Gagal merespon dari Google API");
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0].content) {
            throw new Error("Respon kosong dari AI.");
        }

        const replyText = data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({ reply: replyText });

    } catch (err) {
        console.error("Error di API Chat/Speaking:", err);
        return res.status(500).json({ error: `Gagal memproses chat speaking: ${err.message}` });
    }
}
