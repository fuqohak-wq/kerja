export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { message, history, roleplay, level, isFinalReport } = req.body;
        const apiKey = 'AQ.Ab8RN6L5nK1023ED0NRD_m_d8_q-k7QnSkWcMr8Sh6kBgX8BXQ';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        let systemPrompt = "";

        if (isFinalReport) {
            // Prompt Evaluasi Akhir Speaking
            systemPrompt = `Kamu adalah pakar IELTS dan Guru Bahasa Inggris. Analisis transkrip percakapan berikut antara User dan AI (Karakter: ${roleplay}, Level: ${level}).
Buat laporan lengkap dalam format JSON mentah murni (tanpa markdown \`\`\`json) dengan struktur berikut:
{
  "grammar": 80, "vocabulary": 85, "pronunciation": 75, "fluency": 80, "naturalness": 85, "confidence": 90, "overall": 83,
  "mistakes": [
     {"user": "Kalimat salah user", "correct": "Kalimat yang benar", "explanation": "Penjelasan dalam Bahasa Indonesia"}
  ],
  "newVocab": [
     {"word": "Word", "meaning": "Arti", "example": "Contoh kalimat"}
  ],
  "nextSuggestion": "Saran latihan berikutnya menggunakan Bahasa Indonesia."
}`;
        } else {
            // Prompt Obrolan Telepon Real-time
            systemPrompt = `Kamu sedang berada dalam panggilan telepon interaktif dengan user. 
Karakter kamu: Seorang ${roleplay} berbahasa Inggris native. 
Tingkat kesulitan bahasa yang kamu gunakan harus sesuai level: ${level}.
ATURAN KETAT:
1. Jawab dengan sangat singkat (maksimal 2 kalimat) karena ini adalah obrolan telepon suara.
2. Jangan pernah memberikan koreksi grammar di tengah obrolan! Tetaplah berada dalam peranmu.
3. Jawab 100% dalam Bahasa Inggris. Namun, JIKA user benar-benar bingung atau meminta bantuan, kamu boleh memberikan satu kalimat bantuan/terjemahan kecil dalam kurung menggunakan Bahasa Indonesia.
4. Jangan berikan respons JSON, berikan teks langsung biasa.`;
        }

        // Menyusun riwayat percakapan untuk Gemini
        const contents = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        }));

        if (!isFinalReport) {
            contents.push({ role: 'user', parts: [{ text: message }] });
        }
        
        // Selipkan system prompt di pesan pertama atau sebagai instruksi khusus
        contents.unshift({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}` }] });

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;

        if (isFinalReport) {
            return res.status(200).json(JSON.parse(responseText));
        } else {
            return res.status(200).json({ reply: responseText });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Terjadi kesalahan pada sistem AI.' });
    }
}
