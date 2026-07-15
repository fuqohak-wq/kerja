export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        let systemPrompt = "";
        if (type === 'vocab') {
            systemPrompt = `Kamu adalah Guru Kosakata Oxford. Buatlah daftar 10 kosakata Inggris level B2-C1 secara acak (seed acak ${Math.random()}). 
Berikan arti Bahasa Indonesia dan satu contoh kalimat pendek. 
Tulis semuanya dalam SATU BARIS per kata, jangan gunakan pindah baris (enter) di dalam string nilai JSON.
Sertakan 1 soal kuis pilihan ganda singkat.

Respon WAJIB dalam JSON mentah murni tanpa markdown box:
{
  "words": [
    {"word": "Alleviate", "meaning": "Meringankan atau meredakan", "example": "A warm bath can alleviate stress."}
  ],
  "quiz": {
    "question": "Which word means to make something less severe?",
    "options": ["Alleviate", "Aggravate", "Abandon", "Amplify"],
    "answer": "Alleviate",
    "explanation": "Alleviate berarti meringankan sesuatu yang berat."
  }
}`;
        } else {
            systemPrompt = `Buatlah 1 materi grammar bahasa Inggris esensial harian secara acak (seed acak ${Math.random()}).
Berikan penjelasan super ringkas (max 2 kalimat) dalam Bahasa Indonesia beserta rumus/contohnya.
Jangan gunakan pindah baris (enter) di dalam string nilai JSON.
Sertakan 1 soal kuis pilihan ganda.

Respon WAJIB dalam JSON mentah murni tanpa markdown box:
{
  "topic": "Judul Topik Grammar",
  "explanation": "Penjelasan materi singkat.",
  "formula": "Rumus atau Contoh Kalimat utama",
  "quiz": {
    "question": "Soal kuis grammar fill in the blank",
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
        
        // Pembersihan Agresif Kebal Eror
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        rawText = rawText.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        rawText = rawText.replace(/{\\n/g, '{').replace(/\\n}/g, '}').replace(/,\\n/g, ',');

        return res.status(200).json(JSON.parse(rawText));
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
