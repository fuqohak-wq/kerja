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

    const activeKey = keys[Math.floor(Math.random() * keys.length)];

    // Ambil parameter dari request body secara aman
    const { message, history, roleplay, isFinalReport } = req.body || {};
    const currentMessage = String(message || "Hello").trim();
    const cleanRoleplay = String(roleplay || "English Partner").trim();

    // ==========================================
    // JALUR 1: JIKA INI PERMINTAAN RAPOR EVALUASI AKHIR (DINAMIS DENGAN AI)
    // ==========================================
    if (isFinalReport) {
        if (!activeKey) {
            // Jika tidak ada API key, gunakan respon fallback aman
            return res.status(200).json({
                overall: 80, fluency: 80, grammar: 80, pronunciation: 80, vocabulary: 80,
                mistakes: [{ user: "No conversation history found.", correct: "Start a conversation to get evaluation.", explanation: "Simulasi offline." }]
            });
        }

        try {
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;
            
            // Format riwayat chat menjadi string yang rapi untuk dianalisis AI
            const formattedHistory = (history || []).map(h => `${h.role === 'user' ? 'Student' : 'Tutor'}: "${h.text}"`).join('\n');

            const systemInstruction = `You are an expert English teacher evaluating a student's conversation.
            Analyze the conversation history provided and output a valid JSON object.
            The JSON object must strictly match this structure:
            {
              "overall": <integer score between 0-100>,
              "fluency": <integer score between 0-100>,
              "grammar": <integer score between 0-100>,
              "pronunciation": <integer score between 0-100>,
              "vocabulary": <integer score between 0-100>,
              "mistakes": [
                {
                  "user": "<the incorrect sentence spoken by the student>",
                  "correct": "<the corrected version of that sentence>",
                  "explanation": "<brief, helpful explanation in Indonesian language>"
                }
              ]
            }
            Ensure that you return ONLY raw JSON. If the student made no mistakes, return an empty "mistakes" array.`;

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `Evaluate this conversation:\n\n${formattedHistory}` }]
                    }],
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    generationConfig: {
                        temperature: 0.2,
                        responseMimeType: "application/json" // Memaksa Gemini mengembalikan format JSON murni
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const replyJson = JSON.parse(data.candidates[0].content.parts[0].text);
                    return res.status(200).json(replyJson);
                }
            }
            throw new Error("Gagal memperoleh respons JSON dari Gemini API.");
        } catch (err) {
            console.error("Gagal melakukan evaluasi AI, menggunakan fallback:", err);
            return res.status(200).json({
                overall: 80,
                fluency: 85,
                grammar: 80,
                pronunciation: 80,
                vocabulary: 85,
                mistakes: [
                    {
                        user: "I study English yesterday.",
                        correct: "I studied English yesterday.",
                        explanation: "Gunakan verb 2 (past tense) untuk menceritakan kegiatan yang sudah selesai di masa lampau."
                    }
                ]
            });
        }
    }

    // ==========================================
    // JALUR 2: JALUR CHAT BIASA (INTERAKSI TELEPON)
    // ==========================================
    if (keys.length > 0) {
        try {
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

            let chatContents = [];

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

            while (chatContents.length > 0 && chatContents[0].role === 'model') {
                chatContents.shift();
            }

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

    // JALUR DARURAT (FALLBACK)
    const fallbackReplies = [
        `That sounds very interesting! As your ${cleanRoleplay}, I'd love to hear more. Can you tell me more about it?`,
        `Oh really? That is cool. How long have you been doing that?`,
        `I completely agree with you. What do you think our next step should be?`,
        `That makes sense! Could you explain that part to me once more in English?`
    ];
    
    const randomFallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    return res.status(200).json({ reply: randomFallback });
}
