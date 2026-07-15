import { google } from 'googleapis';

export default async function handler(req, res) {
    // 1. Atur Header CORS agar aman dari pemblokiran akses browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode tidak diizinkan. Silakan gunakan POST.' });
    }

    try {
        const { finalScore } = req.body;

        if (finalScore === undefined || finalScore === null) {
            return res.status(400).json({ success: false, error: 'Nilai finalScore tidak ditemukan di body request.' });
        }

        // 2. Mengambil rahasia dari Environment Variables Vercel
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        if (!clientEmail || !privateKey || !spreadsheetId) {
            return res.status(500).json({ 
                success: false, 
                error: 'Konfigurasi Google Sheets di Vercel belum lengkap (Email, Key, atau ID kosong).' 
            });
        }

        // PERBAIKAN PENTING: Mengatasi masalah karakter newline (\n) yang sering rusak di Vercel
        if (privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        // 3. Autentikasi ke Google API menggunakan Service Account
        const auth = new google.auth.JWT(
            clientEmail,
            null,
            privateKey,
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        const sheets = google.sheets({ version: 'v4', auth });

        // 4. Masukkan skor ke sel B6 di tab DASHBOARD
        // Gunakan VALUE_INPUT_OPTION: 'USER_ENTERED' agar diolah sebagai angka murni
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'DASHBOARD!B6',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[finalScore]]
            }
        });

        // Kirimkan respon balik berupa JSON yang valid
        return res.status(200).json({ success: true, message: 'Skor berhasil diperbarui di sel B6!' });

    } catch (error) {
        console.error("Error Backend Detail:", error);
        // Tetap kirimkan format JSON meskipun server mengalami kendala internal
        return res.status(500).json({ 
            success: false, 
            error: `Gagal memproses data ke Google Sheet. Detail: ${error.message}` 
        });
    }
}
