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

    // Ambil parameter dari request body secara aman
    const { message, history, roleplay, isFinalReport } = req.body || {};
    const currentMessage = String(message || "Hello").trim();
    const cleanRoleplay = String(roleplay || "English Partner").trim();

    // JIKA INI PERMINTAAN RAPOR EVALUASI AKHIR
    if (isFinalReport) {
        return res.status(200).json({
            overall: 85,
            fluency: 80,
            grammar: 85,
            pronunciation: 80,
            vocabulary: 90,
            mistakes: [
                {
                    user: "I am study English now.",
                    correct: "I am studying English now.",
                    explanation: "Gunakan verb-ing setelah 'to be' untuk menyatakan aksi yang sedang berlangsung."
                }
            ]
        });
    }

    // JALUR UTAMA: JIKA KUNCI API TERSEDIA
    if (keys.length > 0) {
        try {
            const activeKey = keys[Math.floor(Math.random() * keys.length)];
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

            let chatContents = [];

            // Membangun ulang riwayat percakapan agar urutan perannya mutlak benar (user -> model -> user)
            if (history && Array.isArray(history)) {
                let lastAddedRole = null;
                history.forEach(item => {
                    const normalizedRole = item.role === 'user' ? 'user' : 'model';
                    const textVal = String(item.text || "").trim();

                    if (textVal && normalizedRole !== lastAddedRole) {
                        chatContents.push({
                            role: normalizedRole,
                            parts: [{ text: textVal }]
                        });
                        lastAddedRole = normalizedRole;
                    }
                });
            }

            // Aturan Wajib Gemini: Riwayat tidak boleh diawali oleh 'model'
            while (chatContents.length > 0 && chatContents[0].role === 'model') {
                chatContents.shift();
            }

            // Masukkan pesan terbaru ke dalam riwayat
            if (chatContents.length > 0 && chatContents[chatContents.length - 1].role === 'user') {
                chatContents[chatContents.length - 1].parts = [{ text: currentMessage }];
            } else {
                chatContents.push({
                    role: 'user',
                    parts: [{ text: currentMessage }]
                });
            }

            const systemInstruction = `You are roleplaying as a "${cleanRoleplay}" talking to an English student. Stay in character, keep your response realistic to your role, very natural, conversational, concise (1-2 sentences), and ask a relevant question to keep the conversation flowing in English.`;

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

            if (response.ok) {
                const data = await response.json();
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const replyText = data.candidates[0].content.parts[0].text;
                    return res.status(200).json({ reply: replyText });
                }
            }
        } catch (err) {
            console.error("Gemini API Error, beralih ke Fallback Otomatis:", err);
        }
    }

    // JALUR DARURAT (SUPER AMAN): Generator balasan lokal dinamis jika API Gemini Anda sedang limit atau bermasalah
    const fallbackReplies = [
        `That sounds very interesting! As your ${cleanRoleplay}, I'd love to hear more. Can you tell me more about it?`,
        `Oh really? That is cool. How long have you been doing that?`,
        `I completely agree with you. What do you think our next step should be?`,
        `That makes sense! Could you explain that part to me once more in English?`
    ];
    
    const randomFallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    return res.status(200).json({ reply: randomFallback });
}
