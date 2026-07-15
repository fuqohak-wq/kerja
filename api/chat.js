export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { message, history, roleplay, level, isFinalReport } = req.body;
        const apiKey = 'AQ.Ab8RN6L5nK1023ED0NRD_m_d8_q-k7QnSkWcMr8Sh6kBgX8BXQ';
        const url = `[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$){apiKey}`;

        let systemPrompt = "";
        if (isFinalReport) {
            systemPrompt = `Analisis transkrip percakapan berikut (Karakter: ${roleplay}, Level: ${level}). Buat laporan JSON mentah murni tanpa markdown \`\`\`json:
{
  "grammar": 80, "vocabulary": 85, "pronunciation": 75, "fluency": 80, "naturalness": 85, "confidence": 90, "overall": 83,
  "mistakes": [{"user": "salah", "correct": "benar", "explanation": "sebab"}],
  "newVocab": [{"word": "kata", "meaning": "arti", "example": "contoh"}],
  "nextSuggestion": "Saran latihan berikutnya."
}`;
        } else {
            systemPrompt = `Kamu adalah ${roleplay} berbahasa Inggris tingkat ${level}. Jawab dengan sangat singkat (maksimal 2 kalimat) untuk telepon suara. 100% Bahasa Inggris. Jangan beri koreksi di tengah obrolan. Jangan berikan JSON, berikan teks biasa langsung.`;
        }

        const formattedContents = [];
        // Tambahkan instruksi sistem di awal
        formattedContents.push({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}` }] });
        
        // Konversi history ke format yang diterima Gemini
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
            formattedContents.push({ role: 'user', parts: [{ text: "Berikan laporan akhir sekarang berdasarkan percakapan di atas." }] });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: formattedContents })
        });

// ... [Kode bagian atas api/chat.js tetap sama] ...

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('Respons kosong dari Gemini');
        }

        let responseText = data.candidates[0].content.parts[0].text;

        if (isFinalReport) {
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            return res.status(200).json(JSON.parse(responseText));
        } else {
            // MENGEMBALIKAN TEKS BERSIH LANGSUNG
            return res.status(200).json({ reply: responseText.trim() });
        }

    } catch (error) {
        console.error('Error di API Chat:', error);
        // Jika error, kembalikan teks ramah sebagai fallback langsung
        return res.status(200).json({ reply: "I'm sorry, could you please repeat that?" });
    }
}
