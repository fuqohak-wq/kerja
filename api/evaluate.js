export default async function handler(req, res) {
    // Mengizinkan CORS sederhana jika diperlukan
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode tidak diizinkan' });
    }

    try {
        const { text, topic, level } = req.body;
        
        // API Key Gemini yang Anda berikan
        const apiKey = 'AQ.Ab8RN6L5nK1023ED0NRD_m_d8_q-k7QnSkWcMr8Sh6kBgX8BXQ'; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const systemPrompt = `Kamu adalah seorang Guru Bahasa Inggris Privat AI yang profesional dan ramah. 
Tugasmu adalah memeriksa tulisan user dengan topik "${topic}" dan tingkat kesulitan "${level}".
Berikan koreksi dan analisis mendalam menggunakan BAHASA INDONESIA.
Kamu HARUS merespons dalam format JSON mentah murni (tanpa markdown box \`\`\`json) dengan struktur objek sebagai berikut:
{
  "grammarCorrection": "Koreksi tata bahasa secara detail",
  "vocabularyCorrection": "Saran kosakata yang lebih baik",
  "naturalExpression": "Cara mengekspresikan ide dengan lebih alami",
  "nativeVersion": "Versi lengkap tulisan jika ditulis oleh seorang Native Speaker",
  "indonesianTranslation": "Arti atau terjemahan versi native tersebut ke Bahasa Indonesia",
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
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        
        // Mengembalikan hasil analisis ke frontend
        return res.status(200).json(JSON.parse(rawText));

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Gagal mengevaluasi tulisan menggunakan AI.' });
    }
}
