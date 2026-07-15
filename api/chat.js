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

    const { message, history } = req.body;

    try {
        // Menggabungkan percakapan agar aman diproses oleh Gemini
        let chatContents = [];

        if (history && Array.isArray(history)) {
            history.forEach(item => {
                chatContents.push({
                    role: item.role === 'user' ? 'user' : 'model',
                    parts: [{ text: String(item.parts || item.text || '') }]
                });
            });
        }

        // Tambahkan pesan terakhir user
        chatContents.push({
            role: 'user',
            parts: [{ text: String(message || "Hello") }]
        });

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: chatContents,
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
        return res.status(500).json({ error: err.message });
    }
}
