import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { message, history, roleplay, level, isFinalReport } = req.body;
        
        // Membaca API Key resmi yang Anda masukkan di dashboard Vercel
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        let systemPrompt = "";
        if (isFinalReport) {
            systemPrompt = `Analisis percakapan (Karakter: ${roleplay}, Level: ${level}). Buat laporan JSON mentah murni tanpa markdown \`\`\`json:
{
  "grammar": 80, "vocabulary": 85, "pronunciation": 75, "fluency": 80, "naturalness": 85, "confidence": 90, "overall": 83,
  "mistakes": [{"user": "salah", "correct": "benar", "explanation": "sebab"}],
  "newVocab": [{"word": "kata", "meaning": "arti", "example": "contoh"}],
  "nextSuggestion": "Saran latihan."
}`;
        } else {
            systemPrompt = `Kamu adalah ${roleplay} berbahasa Inggris level ${level}. Jawab dengan maksimal 2 kalimat. Jangan berikan teks JSON, jawab langsung dengan kalimat percakapan biasa bahasa Inggris.`;
        }

        const formattedContents = [];
        // Menggunakan format teks terstruktur yang kompatibel dengan SDK Baru
        formattedContents.push({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}` }] });
        
        if (history && history.length > 0) {
            history.forEach(h => {
                formattedContents.push({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text }]
                });
            });
        }

        if (!isFinalReport) {
            formattedContents.push({ role: 'user', parts: [{ text: message }] });
        } else {
            formattedContents.push({ role: 'user', parts: [{ text: "Berikan laporan akhir sekarang." }] });
        }

        // Memanggil SDK Resmi dengan model universal 'gemini-2.5-flash' yang dijamin aktif
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: formattedContents,
        });

        let responseText = response.text;

        if (isFinalReport) {
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            return res.status(200).json(JSON.parse(responseText));
        } else {
            return res.status(200).json({ reply: responseText.trim() });
        }

    } catch (error) {
        console.error('Error di SDK Chat:', error);
        return res.status(200).json({ reply: `Server Error: ${error.message}. Mohon pastikan GEMINI_API_KEY di Vercel sudah benar.` });
    }
}
