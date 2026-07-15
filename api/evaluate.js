import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text, topic, level } = req.body;
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const systemPrompt = `Kamu adalah seorang Guru Bahasa Inggris Privat AI. Periksa tulisan user dengan topik "${topic}" dan level "${level}". Berikan analisis dalam BAHASA INDONESIA. Kamu HARUS merespons dalam format JSON mentah murni tanpa markdown box (tanpa \`\`\`json):
{
  "grammarCorrection": "Koreksi tata bahasa secara detail",
  "vocabularyCorrection": "Saran kosakata yang lebih baik",
  "naturalExpression": "Cara mengekspresikan ide dengan lebih alami",
  "nativeVersion": "Versi lengkap tulisan jika ditulis oleh seorang Native Speaker",
  "indonesianTranslation": "Arti atau terjemahan versi native tersebut",
  "score": 85
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'user', parts: [{ text: `Berikut adalah tulisan saya: "${text}"` }] }
            ],
        });

        let rawText = response.text;
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return res.status(200).json(JSON.parse(rawText));

    } catch (error) {
        console.error('Error di SDK Evaluate:', error);
        return res.status(500).json({ error: error.message || 'Gagal mengevaluasi tulisan.' });
    }
}
