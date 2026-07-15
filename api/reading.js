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

        const systemPrompt = `Kamu adalah pembuat materi Reading Comprehension Bahasa Inggris.
Buatlah sebuah artikel/teks panjang terdiri dari PERSIS 3 PARAGRAF dalam BAHASA INGGRIS penuh mengenai tema "${theme}".
Teks harus kaya kosakata baru yang mendidik. 

Selain teks, buatlah 1 buah pertanyaan pilihan ganda (4 opsi) tingkat tinggi (HOTS) berdasarkan teks tersebut untuk ronde kuis saat ini.
Berikan juga daftar terjemahan kata-kata sulit yang ada di dalam teks tersebut ke dalam Bahasa Indonesia.

Kamu WAJIB merespons HANYA dalam format JSON mentah murni tanpa markdown box (\`\`\`json):
{
  "paragraph1": "Isi paragraf 1 dalam bahasa inggris penuh",
  "paragraph2": "Isi paragraf 2 dalam bahasa inggris penuh",
  "paragraph3": "Isi paragraf 3 dalam bahasa inggris penuh",
  "vocabularyMap": {
    "kata_inggris_1": "arti_indonesia_1",
    "kata_inggris_2": "arti_indonesia_2"
  },
  "question": "Pertanyaan kuis terkait teks dalam bahasa inggris",
  "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
  "answer": "Jawaban yang benar (harus persis sama dengan salah satu opsi)",
  "explanation": "Penjelasan detail mengapa jawaban itu benar menggunakan Bahasa Indonesia"
}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
            })
        });

        const data = await response.json();
        if (data.error) return res.status(500).json({ error: data.error.message });

        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return res.status(200).json(JSON.parse(rawText));

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
