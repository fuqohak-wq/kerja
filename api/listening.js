export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean);
    if (keys.length === 0) return res.status(500).json({ error: "API Keys tidak ditemukan." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    const { theme } = req.body || {};
    const selectedTheme = theme || "Daily Conversation";
    const seed = Date.now() + "_" + Math.random();

    // PROMPT KETAT: Meminta 10 Soal Listening Berbeda
    const prompt = `You are an English Listening Test generator. 
Generate EXACTLY 10 different listening test items based on the theme "${selectedTheme}" (Seed: ${seed}).

For EACH item, provide:
1. A natural short English conversation or statement (2-4 lines) for the audio script.
2. A multiple-choice question testing comprehension of that transcript.
3. 4 options (A, B, C, D) with 1 correct answer.
4. An explanation in Bahasa Indonesia.

Output MUST be strictly in valid JSON format matching this structure:
{
  "theme": "${selectedTheme}",
  "items": [
    {
      "id": 1,
      "transcript": "Person A: Hi, what time does the train leave?\\nPerson B: It leaves at 3:30 PM from platform 4.",
      "question": "What time does the train depart?",
      "options": ["3:30 PM", "4:30 PM", "3:00 PM", "4:00 PM"],
      "answer": "3:30 PM",
      "explanation": "Person B menyatakan kereta berangkat jam 3:30 PM."
    }
  ]
}`;

    let lastError = null;

    for (const modelName of models) {
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || "Gagal dari API Google");
            }

            const data = await response.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error("Respons AI kosong.");

            rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const firstOpen = rawText.indexOf('{');
            const lastClose = rawText.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                rawText = rawText.substring(firstOpen, lastClose + 1);
            }

            return res.status(200).json(JSON.parse(rawText));

        } catch (err) {
            lastError = err.message;
            console.warn(`Listening API (${modelName}) warning:`, err.message);
        }
    }

    console.error("Error Listening API (Pindah ke dynamic fallback):", lastError);

    // ==========================================
    // FALLBACK CERDAS (10 Soal Berbeda Sesuai Tema)
    // ==========================================
    return res.status(200).json({
        theme: selectedTheme,
        items: [
            { id: 1, transcript: "Woman: Excuse me, where is the nearest coffee shop?\nMan: Walk two blocks straight, then turn left. It's next to the bank.", question: "Where is the coffee shop located?", options: ["Next to the bank", "Inside the station", "Across the park", "Behind the school"], answer: "Next to the bank", explanation: "Pria tersebut menyebutkan posisinya ada di sebelah bank (next to the bank)." },
            { id: 2, transcript: "Man: Are you ready to order, ma'am?\nWoman: Yes, I would like a grilled chicken salad and iced tea, please.", question: "What food did the woman order?", options: ["Grilled chicken salad", "Beef burger", "Fried rice", "Spaghetti"], answer: "Grilled chicken salad", explanation: "Wanita tersebut memesan grilled chicken salad." },
            { id: 3, transcript: "Woman: What is the weather forecast for tomorrow?\nMan: They said it will rain heavily in the afternoon, so take an umbrella.", question: "What should the woman bring tomorrow?", options: ["An umbrella", "Sunglasses", "A jacket", "A hat"], answer: "An umbrella", explanation: "Pria itu menyarankan membawa payung (umbrella) karena akan hujan deras." },
            { id: 4, transcript: "Man: Did you catch the flight to Bali yesterday?\nWoman: No, my flight was delayed for three hours due to bad weather.", question: "Why was the flight delayed?", options: ["Due to bad weather", "Engine problem", "Pilot arrived late", "Airport was closed"], answer: "Due to bad weather", explanation: "Penerbangan ditunda karena cuaca buruk (due to bad weather)." },
            { id: 5, transcript: "Woman: How much is this blue jacket?\nMan: It is originally sixty dollars, but today it is on sale for forty dollars.", question: "How much does the jacket cost today?", options: ["Forty dollars ($40)", "Sixty dollars ($60)", "Fifty dollars ($50)", "Thirty dollars ($30)"], answer: "Forty dollars ($40)", explanation: "Harga diskon hari ini adalah 40 dolar ($40)." },
            { id: 6, transcript: "Man: Where did you put the car keys?\nWoman: I left them on the kitchen counter next to your wallet.", question: "Where are the car keys?", options: ["On the kitchen counter", "In the bedroom", "Inside the car", "On the dining table"], answer: "On the kitchen counter", explanation: "Kunci mobil ada di atas meja dapur (kitchen counter)." },
            { id: 7, transcript: "Woman: What time does the library close on Saturdays?\nMan: It closes early at 4:00 PM on weekends.", question: "What time does the library close on Saturday?", options: ["4:00 PM", "5:00 PM", "6:00 PM", "8:00 PM"], answer: "4:00 PM", explanation: "Perpustakaan tutup jam 4 sore pada akhir pekan." },
            { id: 8, transcript: "Man: Can you help me move this heavy table?\nWoman: Sure, let me finish washing my hands first.", question: "What will the woman do before helping?", options: ["Finish washing her hands", "Clean the table", "Call a friend", "Drink water"], answer: "Finish washing her hands", explanation: "Dia akan selesai mencuci tangan dulu baru membantu." },
            { id: 9, transcript: "Woman: Is Mr. Smith in his office today?\nMan: No, he is attending a conference in Jakarta until Friday.", question: "Where is Mr. Smith currently?", options: ["Attending a conference in Jakarta", "In his office", "At home", "On vacation in Bali"], answer: "Attending a conference in Jakarta", explanation: "Mr. Smith sedang menghadiri konferensi di Jakarta." },
            { id: 10, transcript: "Man: What subject are you studying for the final exam?\nWoman: I am reviewing organic chemistry; it is quite difficult.", question: "What subject is the woman studying?", options: ["Organic chemistry", "World history", "English literature", "Mathematics"], answer: "Organic chemistry", explanation: "Wanita tersebut sedang mengulang pelajaran kimia organik (organic chemistry)." }
        ]
    });
}
