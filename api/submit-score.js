export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { finalScore } = req.body;

        // TEMPELKAN URL WEB APP DARI GOOGLE APPS SCRIPT ANDA DI BAWAH INI
        const googleScriptUrl = "https://script.google.com/macros/s/AKfycbzfFxfuEbVuN0CEmBzQbaLGywsacI7gPBue45eCKadELkN6mypef1rJ233Xt4FUybXxIQ/exec";

        const response = await fetch(googleScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ finalScore: finalScore })
        });

        const result = await response.json();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
