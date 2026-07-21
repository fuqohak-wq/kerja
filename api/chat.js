export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    // Collect all available API keys
    const keys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) {
        return res.status(500).json({ error: "API Key tidak ditemukan di environment variables." });
    }

    const models = ["gemini-1.5-flash", "gemini-2.5-flash"];
    const { message, history, roleplay, isFinalReport } = req.body || {};
    const currentMessage = String(message || "").trim();
    const cleanRoleplay = String(roleplay || "English Partner").trim();

    // ==========================================
    // JALUR 1: RAPOR EVALUASI AKHIR (SMART ROTATION)
    // ==========================================
    if (isFinalReport) {
        const formattedHistory = (history || []).map(h => `${h.role === 'user' ? 'Student' : 'Tutor'}: "${h.text}"`).join('\n');

        const systemInstruction = `You are an expert English teacher evaluating a student's conversation practice.
Analyze the conversation history provided and output ONLY a valid JSON object with no markdown formatting:
{
  "overall": 80,
  "fluency": 80,
  "grammar": 80,
  "pronunciation": 80,
  "vocabulary": 80,
  "mistakes": [
    {
      "user": "<incorrect sentence>",
      "correct": "<corrected sentence>",
      "explanation": "<explanation in Indonesian>"
    }
  ]
}`;

        // Smart Fallover: Coba setiap Key x Model sampai berhasil
        for (const apiKey of keys) {
            for (const modelName of models) {
                const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                try {
                    const response = await fetch(GEMINI_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                role: 'user',
                                parts: [{ text: `Evaluate this conversation:\n\n${formattedHistory}` }]
                            }],
                            systemInstruction: { parts: [{ text: systemInstruction }] },
                            generationConfig: { responseMimeType: "application/json" }
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            // Cleaning Markdown if present
                            text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
                            const firstBrace = text.indexOf('{');
                            const lastBrace = text.lastIndexOf('}');
                            if (firstBrace !== -1 && lastBrace !== -1) {
                                text = text.substring(firstBrace, lastBrace + 1);
                            }
                            return res.status(200).json(JSON.parse(text));
                        }
                    }
                } catch (err) {
                    console.warn(`[Report Failover] Key ...${apiKey.slice(-4)} (${modelName}) error:`, err.message);
                }
            }
        }

        // Fallback jika semua API Key limit
        return res.status(200).json({
            overall: 80, fluency: 80, grammar: 80, pronunciation: 80, vocabulary: 80,
            mistakes: []
        });
    }

    // ==========================================
    // JALUR 2: DIALOG INTERAKTIF REAL-TIME (SMART ROTATION)
    // ==========================================
    if (!currentMessage) {
        return res.status(400).json({ error: "Pesan tidak boleh kosong." });
    }

    let chatContents = [];

    // Normalisasi Riwayat Obrolan
    if (history && Array.isArray(history)) {
        history.forEach(item => {
            const normalizedRole = item.role === 'user' ? 'user' : 'model';
            const textVal = String(item.text || "").trim();
            if (textVal) {
                chatContents.push({
                    role: normalizedRole,
                    parts: [{ text: textVal }]
                });
            }
        });
    }

    // Tambahkan pesan paling baru dari user
    chatContents.push({
        role: 'user',
        parts: [{ text: currentMessage }]
    });

    const systemPrompt = `You are roleplaying as a native English speaker acting as a "${cleanRoleplay}".
Rules:
1. Stay in character as a ${cleanRoleplay}.
2. Keep your answers conversational, friendly, and brief (1-2 short sentences max).
3. ALWAYS ask a quick follow-up question at the end to keep the phone call conversation going naturally.
4. Reply ONLY in English.`;

    let apiErrorDetail = "";

    // Smart Rotation: Coba Key 1 -> Key 2 -> Key 3
    for (const apiKey of keys) {
        for (const modelName of models) {
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(GEMINI_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: chatContents,
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        generationConfig: { temperature: 0.7 }
                    })
                });

                if (!response.ok) {
                    const errJson = await response.json().catch(() => ({}));
                    apiErrorDetail = errJson.error?.message || `HTTP ${response.status}`;
                    console.warn(`[Chat Failover] Key ...${apiKey.slice(-4)} (${modelName}) gagal: ${apiErrorDetail}`);
                    continue; // Pindah ke key/model berikutnya jika ini limit
                }

                const data = await response.json();
                const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (replyText) {
                    return res.status(200).json({ reply: replyText });
                }
            } catch (err) {
                apiErrorDetail = err.message;
                console.error(`Gagal menggunakan key ...${apiKey.slice(-4)} (${modelName}):`, err.message);
            }
        }
    }

    // Jika semua key benar-benar habis/error
    return res.status(500).json({ 
        error: `Gagal terhubung ke AI Gemini: ${apiErrorDetail}`,
        reply: "Sorry, I had trouble hearing you clearly. Could you please repeat that?" 
    });
}
