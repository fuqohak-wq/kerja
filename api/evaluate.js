export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text, topic, level } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const systemPrompt = `Kamu adalah seorang Guru Bahasa Inggris Privat AI. Periksa tulisan user dengan topik "${topic}" dan level "${level}". Berikan analisis dalam BAHASA INDONESIA. Kamu HARUS merespons dalam format JSON mentah murni tanpa markdown box:\n{\n  "grammarCorrection": "detail",\n  "vocabularyCorrection": "saran",\n  "naturalExpression": "alami",\n  "nativeVersion": "versi native",\n  "indonesianTranslation": "terjemahan",\n  "score": 85\n}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt }] },
                    { role: 'user', parts: [{ text: text }] }
                ]
            })
        });

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return res.status(200).json(JSON.parse(rawText));

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
