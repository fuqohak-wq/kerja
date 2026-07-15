export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text, topic, level } = req.body;
        const apiKey = 'AQ.Ab8RN6L5nK1023ED0NRD_m_d8_q-k7QnSkWcMr8Sh6kBgX8BXQ'; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const systemPrompt = `Kamu adalah seorang Guru Bahasa Inggris Privat AI. Periksa tulisan user dengan topik "${topic}" dan level "${level}". Berikan analisis dalam BAHASA INDONESIA. Kamu HARUS merespons dalam format JSON mentah murni tanpa markdown box (tanpa \`\`\`json):
{
  "grammarCorrection": "Koreksi tata bahasa secara detail",
  "vocabularyCorrection": "Saran kosakata yang lebih baik",
  "naturalExpression": "Cara mengekspresikan ide dengan lebih alami",
  "nativeVersion": "Versi lengkap tulisan jika ditulis oleh seorang Native Speaker",
  "indonesianTranslation": "Arti atau terjemahan versi native tersebut",
  "score": 85
}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: systemPrompt },
                        { text: `Berikut adalah tulisan saya: "${text}"` }
                    ]
                }]
            })
        });

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error(data.error?.message || 'Respons Gemini kosong');
        }

        let rawText = data.candidates[0].content.parts[0].text;
        
        // Membersihkan markdown ```json jika Gemini keras kepala menyertakannya
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return res.status(200).json(JSON.parse(rawText));

    } catch (error) {
        console.error('Error di API Evaluate:', error);
        return res.status(500).json({ error: error.message || 'Gagal mengevaluasi tulisan.' });
    }
}
