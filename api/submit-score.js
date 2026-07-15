export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzfFxfuEbVuN0CEmBzQbaLGywsacI7gPBue45eCKadELkN6mypef1rJ233Xt4FUybXxIQ/exec"; // Ganti dengan URL deployment Web App Anda

    if (req.method === 'POST') {
        try {
            const { finalScore } = req.body;
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "submit-score", finalScore })
            });

            const textResult = await response.text();
            
            // Cek apakah balasan berupa HTML (error Google) atau JSON valid
            if (textResult.startsWith("<!DOCTYPE") || textResult.startsWith("<html")) {
                throw new Error("Google Apps Script mengembalikan HTML. Pastikan deployment diset ke 'Anyone'.");
            }

            const jsonResult = JSON.parse(textResult);
            return res.status(200).json(jsonResult);
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    } else if (req.method === 'GET') {
        // Mengambil data untuk halaman progress
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL);
            const textResult = await response.text();
            if (textResult.startsWith("<!DOCTYPE")) {
                return res.status(200).json({ scoreB6: 0, streak: 3, history: [] });
            }
            const data = JSON.parse(textResult);
            return res.status(200).json(data);
        } catch (err) {
            return res.status(200).json({ scoreB6: 0, streak: 3, history: [] });
        }
    } else {
        return res.status(405).json({ error: 'Metode tidak diizinkan.' });
    }
}
