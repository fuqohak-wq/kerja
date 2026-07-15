export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type } = req.body; // 'vocab' atau 'grammar'
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        let systemPrompt = "";
        if (type === 'vocab') {
            systemPrompt = `Bertindaklah sebagai Guru Kosakata Oxford. Buatlah daftar 10 kosakata bahasa Inggris level menengah-atas (B2-C1) secara acak (gunakan seed acak ${Math.random()}). 
Untuk setiap kata berikan arti Bahasa Indonesia dan satu contoh kalimat pendek. 
Juga sertakan 1 soal kuis pilihan ganda singkat untuk menguji salah satu kata dari daftar tersebut.

Respon WAJIB dalam JSON mentah murni tanpa markdown box:
{
  "words": [
    {"word": "Alleviate", "meaning": "Meringankan/meredakan", "example": "A warm bath can alleviate stress."}
  ],
  "quiz": {
    "question": "Which word means 'to make something less severe'?",
    "options": ["Alleviate", "Aggravate", "Abandon", "Amplify"],
    "answer": "Alleviate",
    "explanation": "Alleviate berarti meringankan atau meredakan sesuatu yang berat/sakit."
  }
}`;
        } else {
            systemPrompt = `Buatlah 1 materi grammar bahasa Inggris esensial harian secara acak (contoh: Inversion, Gerund, Conditional, Relative Clause) dengan seed acak ${Math.random()}.
Berikan penjelasan super ringkas (max 3 kalimat) dalam Bahasa Indonesia beserta rumus/contohnya.
Sertakan juga 1 soal kuis pilihan ganda untuk menguji pemahaman grammar tersebut.

Respon WAJIB dalam JSON mentah murni tanpa markdown box:
{
  "topic": "Judul Topik Grammar",
  "explanation": "Penjelasan materi singkat dalam Bahasa Indonesia.",
  "formula": "Rumus / Contoh Kalimat utama",
  "quiz": {
    "question": "Soal kuis grammar (fill in the blank)",
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    "answer": "Pilihan yang benar",
    "explanation": "Alasan singkat dalam Bahasa Indonesia."
  }
}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: systemPrompt }] }] })
        });

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim().replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        rawText = rawText.replace(/{\\n/g, '{').replace(/\\n}/g, '}').replace(/,\\n/g, ',');

        return res.status(200).json(JSON.parse(rawText));
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
