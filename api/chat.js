export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ error: "API Keys tidak ditemukan." });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

    // Ditambahkan: Ekstrak parameter 'roleplay' dari frontend
    const { message, history, roleplay } = req.body || {};

    try {
        let chatContents = [];

        // 1. Susun riwayat obrolan
        if (history && Array.isArray(history)) {
            history.forEach(item => {
                chatContents.push({
                    role: item.role === 'user' ? 'user' : 'model',
                    parts: [{ text: String(item.parts || item.text || '') }]
                });
            });
        }

        // PERBAIKAN UTAMA: Pastikan riwayat tidak diawali oleh 'model' (mencegah Error 400 dari Gemini)
        if (chatContents.length > 0 && chatContents[0].role === 'model') {
            chatContents.unshift({
                role: 'user',
                parts: [{ text: "Hello, let's start the conversation." }]
            });
        }

        // 2. Masukkan pesan terbaru dari pengguna di akhir array
        chatContents.push({
            role: 'user',
            parts: [{ text: String(message || "Hello") }]
        });

        // PERBAIKAN KEDUA: Sesuaikan instruksi karakter AI secara dinamis berdasarkan 'roleplay' yang dipilih
        let systemInstruction = "You are a friendly English speaking practice partner. Keep your response natural, conversational, concise (2-3 sentences), and occasionally ask a follow-up question to keep the conversation going in English.";
        
        if (roleplay) {
            systemInstruction = `You are roleplaying as a "${roleplay}" talking to an English student. Stay in character, keep your response realistic to your role, very natural, conversational, concise (2-3 sentences), and ask a relevant question to keep the conversation flowing in English.`;
        }

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: chatContents,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Gagal dari Google API");
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0].content) {
            throw new Error("Respon kosong dari AI.");
        }

        const replyText = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply: replyText });

    } catch (err) {
        console.error("Error di API Chat:", err);
        // Fallback jika API benar-benar down/limit habis
        return res.status(200).json({ 
            reply: "I'm sorry, I had a bit of trouble hearing that. Could you please repeat what you said?" 
        });
    }
}
