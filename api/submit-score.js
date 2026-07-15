import { google } from 'googleapis';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { finalScore } = req.body;

        // Validasi Google Credentials dari Environment Variables
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = '1EgSAs2Bygj2oveSmpFjS9TuSkhKzaPXtbTAPC0EbEok';
        
        // Update nilai tepat di tab DASHBOARD kolom B6
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'DASHBOARD!B6',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[finalScore]]
            }
        });

        return res.status(200).json({ success: true, message: 'Skor akumulasi berhasil dikirim ke B6!' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
