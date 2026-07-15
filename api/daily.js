export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: "GEMINI_API_KEY belum dipasang di Vercel Env!" });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        let promptText = type === 'vocab' 
            ? "Bertindak sebagai Guru Oxford. Buat 10 kosakata Inggris level B2-C1 acak. Berikan arti Indonesia dan 1 contoh kalimat. Sertakan 1 kuis pilihan ganda terkait kata tersebut. Berikan respons HANYA dalam format JSON mentah murni tanpa markdown box: {\"words\": [{\"word\": \"Alleviate\", \"meaning\": \"Meringankan\", \"example\": \"A warm bath can alleviate stress.\"}], \"quiz\": {\"question\": \"Meaning of alleviate?\", \"options\": [\"To make less severe\", \"To make worse\", \"To ignore\", \"To build\"], \"answer\": \"To make less severe\", \"explanation\": \"Alleviate artinya meringankan.\"}}"
            : "Buat 1 materi grammar bahasa Inggris esensial acak (contoh: Inversion, Gerund, Conditional, Relative Clause). Berikan penjelasan ringkas (max 2 kalimat) dalam Bahasa Indonesia dan rumus/contoh kalimat utama. Sertakan 1 soal kuis pilihan ganda. Berikan respons HANYA dalam format JSON mentah murni tanpa markdown box: {\"topic\": \"Topik\", \"explanation\": \"Penjelasan\", \"formula\": \"Rumus\", \"quiz\": {\"question\": \"Soal\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"answer\": \"A\", \"explanation\": \"Alasan\"}}";

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();
        if (data.error) return res.status(500).json({ error: data.error.message });

        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        return res.status(200).json(JSON.parse(rawText));
    } catch (error) {
        return res.status(500).json({ error: `Crash: ${error.message}` });
    }
}
