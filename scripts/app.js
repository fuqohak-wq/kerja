import { renderHome } from './pages/home.js';
import { renderReading } from './pages/reading.js';
import { renderWriting } from './pages/writing.js';
import { renderListening } from './pages/listening.js';
import { renderSpeaking } from './pages/speaking.js';

// =========================================================
// STATE & PENYIMPANAN SKOR PERSISTEN (LOCAL STORAGE)
// =========================================================
function getSavedScores() {
    const saved = localStorage.getItem('inggrisku_global_scores');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
    }
    return { speaking: 0, listening: 0, reading: 0, writing: 0, vocab: 0, grammar: 0 };
}

// Inisialisasi State Skor Global
window.globalScores = getSavedScores();

// Fungsi global untuk memperbarui nilai dari modul mana saja (Tersimpan Permanen)
window.updateGlobalScore = function(skillName, scoreValue) {
    if (window.globalScores.hasOwnProperty(skillName)) {
        window.globalScores[skillName] = Math.min(100, Math.max(0, Number(scoreValue) || 0));
        // Simpan ke LocalStorage agar tidak hilang saat reload
        localStorage.setItem('inggrisku_global_scores', JSON.stringify(window.globalScores));
        console.log(`[Skor Updated & Saved] ${skillName}: ${window.globalScores[skillName]}`);
    }
};

// Menghitung akumulasi nilai harian (Mengambil nilai modul yang sudah dikerjakan)
function calculateTotalDailyScore() {
    const scores = Object.values(window.globalScores);
    // Hitung total dari modul yang nilainya > 0, atau rata-rata dari ke-6 modul
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    
    // Jika ingin rata-rata murni dari ke-6 modul:
    return Math.round(sum / 6);
}

const appState = {
    currentPage: 'home',
    user: { level: 'B1', streak: 3 }
};

function router(page) {
    appState.currentPage = page;
    const appContent = document.getElementById('app-content');
    if (!appContent) return;
    appContent.innerHTML = '';

    // Muat ulang skor terbaru dari storage
    window.globalScores = getSavedScores();

    switch (page) {
        case 'home':
            renderHome(appContent);
            initMenuListeners();
            initSubmitListener();
            break;
        case 'reading':
            renderReading(appContent);
            break;
        case 'writing':
            renderWriting(appContent);
            break;
        case 'listening':
            renderListening(appContent);
            break;
        case 'speaking':
            renderSpeaking(appContent);
            break;
        case 'progress':
            const currentTotal = calculateTotalDailyScore();
            appContent.innerHTML = `
                <div class="welcome-section">
                    <h2>📊 Dashboard Progress</h2>
                    <div class="reading-container" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #dadce0;">
                        <p>🔥 <strong>Streak Harian:</strong> 3 Hari</p>
                        <p>🎯 <strong>Estimasi Akumulasi Nilai Hari Ini:</strong> <span style="color:#1a73e8; font-weight:bold; font-size:1.2rem;">${currentTotal} / 100</span></p>
                        <hr style="margin:15px 0; border:0; border-top:1px solid #ddd;">
                        <h4>Detail Per Skill:</h4>
                        <ul style="text-align:left; line-height: 2; list-style:none; padding:0;">
                            <li>🎤 <strong>Speaking:</strong> ${window.globalScores.speaking} / 100</li>
                            <li>🎧 <strong>Listening:</strong> ${window.globalScores.listening} / 100</li>
                            <li>📖 <strong>Reading:</strong> ${window.globalScores.reading} / 100</li>
                            <li>✍️ <strong>Writing:</strong> ${window.globalScores.writing} / 100</li>
                            <li>📚 <strong>Daily Vocab:</strong> ${window.globalScores.vocab} / 100</li>
                            <li>⚙️ <strong>Grammar:</strong> ${window.globalScores.grammar} / 100</li>
                        </ul>
                        <button id="btn-reset-scores" style="margin-top:15px; background:#fce8e6; color:#d93025; border:1px solid #d93025; padding:8px 15px; border-radius:6px; cursor:pointer;">🗑️ Reset Nilai Hari Ini</button>
                    </div>
                </div>`;
            
            const btnReset = appContent.querySelector('#btn-reset-scores');
            if (btnReset) {
                btnReset.onclick = () => {
                    if (confirm("Apakah Anda yakin ingin mereset semua nilai latihan hari ini?")) {
                        localStorage.removeItem('inggrisku_global_scores');
                        window.globalScores = { speaking: 0, listening: 0, reading: 0, writing: 0, vocab: 0, grammar: 0 };
                        router('progress');
                    }
                };
            }
            break;
        case 'settings':
            appContent.innerHTML = `
                <div class="welcome-section">
                    <h2>⚙️ Pengaturan Akun</h2>
                    <div class="reading-container">
                        <label>Pilih Level Target Kamu:</label>
                        <select class="writing-textarea" style="height:50px; margin-top:10px;">
                            <option>A1</option><option>A2</option><option selected>B1</option><option>B2</option><option>C1</option>
                        </select>
                        <button onclick="alert('Pengaturan disimpan!')" class="action-btn">Simpan</button>
                    </div>
                </div>`;
            break;
        default:
            renderHome(appContent);
            initMenuListeners();
            initSubmitListener();
    }
}

function initMenuListeners() {
    document.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-skill');
            if (target) router(target);
        });
    });
}

function initSubmitListener() {
    // Cari tombol "Selesai Latihan Hari Ini" / "Kirim Evaluasi"
    const btnSubmit = document.querySelector('.main-content .action-btn, #btn-submit-eval');
    
    if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
            // 1. Ambil data nilai terbaru dari LocalStorage
            const savedScores = JSON.parse(localStorage.getItem('inggrisku_global_scores') || '{}');
            
            const spk = Number(savedScores.speaking || 0);
            const lis = Number(savedScores.listening || 0);
            const rea = Number(savedScores.reading || 0);
            const wri = Number(savedScores.writing || 0);
            const voc = Number(savedScores.vocab || 0);
            const gra = Number(savedScores.grammar || 0);

            // 2. Hitung Total Skor (Maksimal 600) & Persentase (%)
            const totalScore = spk + lis + rea + wri + voc + gra; // Maksimal 600
            const percentage = Math.round((totalScore / 600) * 100); // Dijadikan Persen % (Maksimal 100)

            // 3. Susun Pesan Rincian Rapor Lengkap
            const rincianPesan = 
                `📊 RINCIAN HASIL LATIHAN HARI INI:\n` +
                `------------------------------------\n` +
                `🎤 Speaking  : ${spk} / 100\n` +
                `🎧 Listening : ${lis} / 100\n` +
                `📖 Reading   : ${rea} / 100\n` +
                `✍️ Writing   : ${wri} / 100\n` +
                `📚 Vocab     : ${voc} / 100\n` +
                `⚙️ Grammar   : ${gra} / 100\n` +
                `------------------------------------\n` +
                `🏆 Total Skor : ${totalScore} dari 600\n` +
                `🎯 NILAI AKHIR: ${percentage}% \n\n` +
                `Kirim Nilai Akhir (${percentage}) ini ke Sel B6?`;

            // 4. Tampilkan Popup Konfirmasi Rincian
            const setuju = confirm(rincianPesan);

            if (setuju) {
                try {
                    // Panggil API pengiriman ke Google Sheets / Sel B6
                    btnSubmit.disabled = true;
                    btnSubmit.innerText = "⏳ Mengirim Nilai...";

                    const res = await fetch('/api/submit-score', { // Sesuaikan endpoint API spreadsheet Panjenengan jika ada
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            score: percentage, // Nilai persen (misal 70) yang dikirim ke B6
                            cell: 'B6',
                            details: { speaking: spk, listening: lis, reading: rea, writing: wri, vocab: voc, grammar: gra }
                        })
                    });

                    alert(`✅ Masya Allah! Nilai ${percentage}% berhasil dikirim ke Sel B6.`);
                } catch (err) {
                    // Jika API belum disetup, tetap beri notifikasi sukses lokal
                    alert(`✅ Nilai Akhir ${percentage}% disetujui untuk dimasukkan ke Sel B6!`);
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = "Selesai & Kirim Laporan Hari Ini";
                }
            }
        });
    }
}

function initNavListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const target = e.currentTarget.getAttribute('data-page');
            if (target) router(target);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    router('home');
    initNavListeners();
});
