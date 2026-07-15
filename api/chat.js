export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { message, history, roleplay, level, isFinalReport } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        
        // URL Endpoint Universal Terstabil untuk Gemini 2.5 Flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        let systemPrompt = isFinalReport 
            ? `Analisis percakapan (Karakter: ${roleplay}, Level: ${level}). Buat laporan JSON mentah murni tanpa markdown \`\`\`json:\n{\n  "grammar": 80, "vocabulary": 85, "pronunciation": 75, "fluency": 80, "naturalness": 85, "confidence": 90, "overall": 83,\n  "mistakes": [{"user": "salah", "correct": "benar", "explanation": "sebab"}],\n  "newVocab": [{"word": "kata", "meaning": "arti", "example": "contoh"}],\n  "nextSuggestion": "Saran latihan."\n}`
            : `Kamu adalah ${roleplay} berbahasa Inggris level ${level}. Jawab dengan maksimal 2 kalimat langsung sebagai obrolan telepon suara. Jangan berikan teks JSON.`;

        const contents = [
            { role: 'user', parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}` }] }
        ];
        
        if (history && history.length > 0) {
            history.forEach(h => {
                contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] });
            });
        }

        if (!isFinalReport) {
            contents.push({ role: 'user', parts: [{ text: message }] });
        } else {
            contents.push({ role: 'user', parts: [{ text: "Berikan laporan akhir JSON sekarang." }] });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(200).json({ reply: `Gemini Error: ${data.error.message}` });
        }

        let responseText = data.candidates[0].content.parts[0].text;

        if (isFinalReport) {
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            return res.status(200).json(JSON.parse(responseText));
        } else {
            return res.status(200).json({ reply: responseText.trim() });
        }

    } catch (error) {
        return res.status(500).json({ error: `Server Crash: ${error.message}` });
    }
}
