export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { theme } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const systemPrompt = `Kamu adalah pembuat kuis Listening Bahasa Inggris profesional. 
Buatlah satu teks pendek (3-5 kalimat) dalam BAHASA INGGRIS penuh mengenai tema "${theme}". 
Teks tersebut harus cocok dibacakan untuk latihan mendengarkan (listening). 
Kemudian buat 1 pertanyaan pilihan ganda (4 opsi) berdasarkan teks tersebut beserta penjelasan jawabannya dalam Bahasa Indonesia.

Kamu WAJIB merespons HANYA dalam format JSON mentah murni tanpa markdown box (\`\`\`json):
{
  "audioText": "Teks bahasa inggris penuh yang akan dibacakan oleh suara AI nanti",
  "question": "Pertanyaan dalam bahasa inggris",
  "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
  "answer": "Pilihan yang benar (harus persis sama dengan salah satu string di array options)",
  "explanation": "Penjelasan mengapa jawaban itu benar menggunakan Bahasa Indonesia"
}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return res.status(200).json(JSON.parse(rawText));

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
