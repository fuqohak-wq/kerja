export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { message, history, roleplay, level, isFinalReport } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: formattedContents })
        });

        const data = await response.json();
        
        // MENGANGKAP ERROR DARI GOOGLE GEMINI
        if (data.error) {
            return res.status(200).json({ reply: `Gemini API Error: ${data.error.message}` });
        }

        if (!data.candidates || data.candidates.length === 0) {
            return res.status(200).json({ reply: "Error: Gemini returned empty candidates." });
        }

        let responseText = data.candidates[0].content.parts[0].text;

        if (isFinalReport) {
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            return res.status(200).json(JSON.parse(responseText));
        } else {
            return res.status(200).json({ reply: responseText.trim() });
        }

    } catch (error) {
        console.error('Error di API Chat:', error);
        return res.status(200).json({ reply: `Server Internal Error: ${error.message}` });
    }
}
