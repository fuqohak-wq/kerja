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
        return res.status(500).json({ error: "API Key tidak ditemukan di environment variables." });
    }

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    // Gunakan gemini-1.5-flash sebagai prioritas utama karena sangat stabil untuk obrolan/chat
    const models = ["gemini-1.5-flash", "gemini-2.5-flash"];

    const { message, history, roleplay, isFinalReport } = req.body || {};
    const currentMessage = String(message || "").trim();
    const cleanRoleplay = String(roleplay || "English Partner").trim();

    // ==========================================
    // JALUR 1: RAPOR EVALUASI AKHIR
    // ==========================================
    if (isFinalReport) {
        const formattedHistory = (history || []).map(h => `${h.role === 'user' ? 'Student' : 'Tutor'}: "${h.text}"`).join('\n');

        const systemInstruction = `You are an expert English teacher evaluating a student's conversation.
Analyze the conversation history provided and output a valid JSON object.
The JSON object must strictly match this structure:
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

        for (const modelName of models) {
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;
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
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) return res.status(200).json(JSON.parse(text));
                }
            } catch (err) {
                console.warn(`Chat Report Error (${modelName}):`, err.message);
            }
        }

        return res.status(200).json({
            overall: 80, fluency: 80, grammar: 80, pronunciation: 80, vocabulary: 80,
            mistakes: []
        });
    }

    // ==========================================
    // JALUR 2: DIALOG INTERAKTIF REAL-TIME
    // ==========================================
    if (!currentMessage) {
        return res.status(400).json({ error: "Pesan tidak boleh kosong." });
    }

    let chatContents = [];

    // Olah Riwayat Obrolan
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

    // Tambahkan pesan user paling baru
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

    for (const modelName of models) {
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;

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
                const errJson = await response.json();
                throw new Error(errJson.error?.message || `HTTP status ${response.status}`);
            }

            const data = await response.json();
            const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (replyText) {
                // SANGAT PENTING: Mengembalikan balasan murni dari Gemini AI
                return res.status(200).json({ reply: replyText });
            }
        } catch (err) {
            apiErrorDetail = err.message;
            console.error(`Gagal menggunakan ${modelName}:`, err.message);
        }
    }

    // Jika Gemini API benar-benar error/gagal, kembalikan status error agar kamu tau di console (Bukan fallback pura-pura)
    return res.status(500).json({ 
        error: `Gagal terhubung ke AI Gemini: ${apiErrorDetail}`,
        reply: "Sorry, I had trouble hearing you. Could you please repeat that?" 
    });
}
