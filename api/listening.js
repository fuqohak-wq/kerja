export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const { theme } = req.body || {};
    const selectedTheme = theme || "General English Conversation";
    const seed = Date.now() + "_" + Math.floor(Math.random() * 100000);

    // PROMPT DENGAN FORMAT RIGID SANGAT AMAN
    const prompt = `You are an expert Islamic studies lecturer and English test developer.
Generate 5 high-quality, unique multiple-choice English listening comprehension questions for students studying: "${selectedTheme}".
Seed/Uniqueness Key: ${seed}.

Requirements for each item:
- transcript: A short natural English conversation or passage (2-3 lines) strictly related to ${selectedTheme}.
- question: Clear comprehension question in English.
- options: 4 distinct choices in English.
- answer: The exact text of the correct choice.
- explanation: A helpful brief explanation in Bahasa Indonesia.

OUTPUT FORMAT MUST BE STRICTLY VALID JSON ONLY (NO MARKDOWN CODEBLOCKS):
{
  "theme": "${selectedTheme}",
  "items": [
    {
      "id": 1,
      "transcript": "...",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "..."
    }
  ]
}`;

    // ==========================================
    // JALUR 1: PERCOBAAN UTAMA (GEMINI 2.5 FLASH)
    // ==========================================
    const geminiKeys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean);
    if (geminiKeys.length > 0) {
        const activeGeminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
        const geminiModels = ["gemini-2.5-flash", "gemini-1.5-flash"];

        for (const modelName of geminiModels) {
            try {
                console.log(`[Listening API] Memanggil Google Gemini (${modelName})...`);
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeGeminiKey}`;
                
                const response = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { 
                            responseMimeType: "application/json",
                            temperature: 0.8 
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (rawText) {
                        const parsedData = parseJsonResponse(rawText);
                        if (parsedData && parsedData.items && parsedData.items.length > 0) {
                            console.log(`[Listening API] Berhasil mendapatkan data dari Gemini!`);
                            return res.status(200).json(parsedData);
                        }
                    }
                }
            } catch (err) {
                console.warn(`[Gemini Error - ${modelName}]:`, err.message);
            }
        }
    }

    // ==========================================
    // JALUR 2: BACKUP CADANGAN SANGAT CEPT (GROQ AI)
    // ==========================================
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
        try {
            console.log(`[Listening API] Gemini gagal/sibuk. Mengalihkan ke Groq AI (Llama 3)...`);
            const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
            
            const response = await fetch(groqUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${groqApiKey}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "You output JSON only. Do not include markdown codeblocks." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    response_format: { type: "json_object" }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const rawText = data.choices?.[0]?.message?.content;
                if (rawText) {
                    const parsedData = parseJsonResponse(rawText);
                    if (parsedData && parsedData.items && parsedData.items.length > 0) {
                        console.log(`[Listening API] Berhasil mendapatkan data dari Groq AI!`);
                        return res.status(200).json(parsedData);
                    }
                }
            }
        } catch (err) {
            console.warn(`[Groq AI Error]:`, err.message);
        }
    }

    // ==========================================
    // JIKA SEMUA AI GAGAL -> JUJUR KIRIM ERROR!
    // (TIDAK ADA DATA STATIS/FALLBACK PALSU)
    // ==========================================
    console.error("[Listening API] Semua Provider AI Gagal.");
    return res.status(503).json({ 
        error: "Server AI sedang sibuk atau kehabisan kuota limit. Silakan klik 'Coba Lagi' dalam beberapa detik." 
    });
}

// Helper pembersih JSON
function parseJsonResponse(rawText) {
    try {
        let cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstOpen = cleanText.indexOf('{');
        const lastClose = cleanText.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            cleanText = cleanText.substring(firstOpen, lastClose + 1);
        }
        return JSON.parse(cleanText);
    } catch (e) {
        return null;
    }
}
