// Konfigurasi ID Sheet Anda
const SHEET_ID = '1GZxUzK2SUVjga1QLdWTzLzqdO91FHIctWY88xEPZupY';

// Endpoint untuk mengekspor sheet spesifik sebagai CSV berkode UTF-8
export const SHEET_URLS = {
    QUESTION_BANK: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=168826503`,
    LOG: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`, // Ganti GID jika log berbeda
    PROGRESS: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1` // Ganti GID jika progress berbeda
};

/**
 * Fungsi untuk mengubah teks CSV menjadi Array of Objects secara manual (Vanilla JS)
 * @param {string} csvText 
 * @returns {Array<Object>}
 */
function parseCSV(csvText) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    // Parser CSV canggih untuk menangani koma di dalam tanda kutip (artikel/soal teks panjang)
    for (let i = 0; i < csvText.length; i++) {
        let c = csvText[i];
        let next = csvText[i+1];
        if (c === '"') {
            if (inQuotes && next === '"') { row[row.length - 1] += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (c === ',' && !inQuotes) {
            row.push('');
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') { i++; }
            lines.push(row);
            row = [''];
        } else {
            row[row.length - 1] += c;
        }
    }
    if (row.length > 1 || row[0] !== '') lines.push(row);

    const headers = lines[0].map(h => h.trim().toLowerCase());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].length < headers.length) continue;
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = lines[i][j] ? lines[i][j].trim() : '';
        }
        result.push(obj);
    }
    return result;
}

/**
 * Mengambil data bank soal dari Google Sheets
 * @returns {Promise<Array<Object>>}
 */
export async function fetchQuestionBank() {
    try {
        const response = await fetch(SHEET_URLS.QUESTION_BANK);
        if (!response.ok) throw new Error('Gagal mengambil data dari Google Sheet');
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('Error fetching sheet:', error);
        return [];
    }
}
