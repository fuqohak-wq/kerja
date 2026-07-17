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

    const { message, history, roleplay } = req.body || {};

    try {
        let chatContents = [];

        // 1. Filter riwayat percakapan agar benar-benar bersih dan rapi
        if (history && Array.isArray(history)) {
            let lastRole = null;
            history.forEach(item => {
                const currentItemRole = item.role === 'user' ? 'user' : 'model';
                const textContent = String(item.text || item.parts?.[0]?.text || '').trim();

                if (textContent) {
                    // Hindari duplikasi peran berurutan (misal: user setelah user, atau model setelah model)
                    if (currentItemRole !== lastRole) {
                        chatContents.push({
                            role: currentItemRole,
                            parts: [{ text: textContent }]
                        });
                        lastRole = currentItemRole;
                    }
                }
            });
        }

        // 2. Bersihkan bagian awal riwayat. Harus diawali oleh 'user'
        while (chatContents.length > 0 && chatContents[0].role === 'model') {
            chatContents.shift(); // Hapus item pertama jika itu dari model/AI
        }

        // 3. Masukkan pesan terbaru dari pengguna
        // Jika pesan terakhir di riwayat adalah 'user', gabung atau ganti saja agar tidak terjadi bentrok peran berurutan
        const cleanMessage = String(message || "Hello").trim();
        if (chatContents.length > 0 && chatContents[chatContents.length - 1].role === 'user') {
            chatContents[chatContents.length - 1].parts = [{ text: cleanMessage }];
        } else {
            chatContents.push({
                role: 'user',
                parts: [{ text: cleanMessage }]
            });
        }

        // 4. Sesuaikan instruksi karakter AI secara dinamis
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
        return res.status(200).json({ 
            reply: "I'm sorry, I had a bit of trouble hearing that. Could you please repeat what you said?" 
        });
    }
}
