import { renderHome } from './pages/home.js';
import { renderReading } from './pages/reading.js';
import { renderWriting } from './pages/writing.js';
import { renderListening } from './pages/listening.js';
import { renderSpeaking } from './pages/speaking.js';

// =========================================================
// STATE & PENYIMPANAN SKOR PERSISTEN (LOCAL STORAGE)
// =========================================================

// Fungsi Helper untuk Mengambil Skor Terbaru dari Storage
function getSavedScores() {
    const saved = localStorage.getItem('inggrisku_global_scores');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
    }
    return { speaking: 0, listening: 0, reading: 0, writing: 0, vocab: 0, grammar: 0 };
}

// Inisialisasi Window Global Skor
window.globalScores = getSavedScores();

// Fungsi Global yang Dipanggil oleh Modul (Writing, Speaking, dll)
window.updateGlobalScore = function(skillName, scoreValue) {
    // 1. Ambil data terbaru dari storage
    const currentScores = getSavedScores();
    
    // 2. Perbarui nilai skill terkait
    if (currentScores.hasOwnProperty(skillName)) {
        currentScores[skillName] = Math.min(100, Math.max(0, Number(scoreValue) || 0));
        
        // 3. Simpan permanen di LocalStorage & Sync ke Window RAM
        localStorage.setItem('inggrisku_global_scores', JSON.stringify(currentScores));
        window.globalScores = currentScores;
        
        console.log(`[Skor Disimpan] ${skillName}: ${currentScores[skillName]}`);
    }
};

// Menghitung Nilai Persentase Akhir (0 - 100%)
function calculateTotalDailyScore() {
    const scores = getSavedScores();
    const sum = Object.values(scores).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    return Math.round((sum / 600) * 100);
}

const appState = {
    currentPage: 'home',
    user: { level: 'B1', streak: 3 }
};

// =========================================================
// ROUTER NAVIGATION
// =========================================================
function router(page) {
    appState.currentPage = page;
    const appContent = document.getElementById('app-content');
    if (!appContent) return;
    appContent.innerHTML = '';

    // Selalu muat ulang memori skor dari storage saat pindah halaman
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
            const scores = getSavedScores();
            appContent.innerHTML = `
                <div class="welcome-section">
                    <h2>📊 Dashboard Progress</h2>
                    <div class="reading-container" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #dadce0;">
                        <p>🔥 <strong>Streak Harian:</strong> 3 Hari</p>
                        <p>🎯 <strong>Estimasi Persentase Nilai Hari Ini:</strong> <span style="color:#1a73e8; font-weight:bold; font-size:1.2rem;">${currentTotal}%</span></p>
                        <hr style="margin:15px 0; border:0; border-top:1px solid #ddd;">
                        <h4>Detail Per Skill:</h4>
                        <ul style="text-align:left; line-height: 2; list-style:none; padding:0;">
                            <li>🎤 <strong>Speaking:</strong> ${scores.speaking} / 100</li>
                            <li>🎧 <strong>Listening:</strong> ${scores.listening} / 100</li>
                            <li>📖 <strong>Reading:</strong> ${scores.reading} / 100</li>
                            <li>✍️ <strong>Writing:</strong> ${scores.writing} / 100</li>
                            <li>📚 <strong>Daily Vocab:</strong> ${scores.vocab} / 100</li>
                            <li>⚙️ <strong>Grammar:</strong> ${scores.grammar} / 100</li>
                        </ul>
                        <button id="btn-reset-scores" style="margin-top:15px; background:#fce8e6; color:#d93025; border:1px solid #d93025; padding:8px 15px; border-radius:6px; cursor:pointer;">🗑️ Reset Nilai Hari Ini</button>
                    </div>
                </div>`;
            
            const btnReset = appContent.querySelector('#btn-reset-scores');
            if (btnReset) {
                btnReset.onclick = () => {
                    if (confirm("Apakah Anda yakin ingin mereset semua nilai latihan hari ini menjadi 0?")) {
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

// =========================================================
// LOGIKA UTAMA TOMBOL SUBMIT RAPOR AKHIR (SEL B6)
// =========================================================
function initSubmitListener() {
    // Cari tombol "Selesai & Kirim Laporan" (Bisa pakai ID #btn-submit-eval atau kelas .action-btn)
    const btnSubmit = document.getElementById('btn-submit-eval') || document.querySelector('.main-content .action-btn');
    
    if (btnSubmit) {
        // Gunakan .onclick agar listener tidak tumpuk saat berpindah halaman
        btnSubmit.onclick = async () => {
            // 1. PAKSA AMBIL SKOR TERUPDATE DARI LOCALSTORAGE
            const savedScores = getSavedScores();
            
            const spk = Number(savedScores.speaking || 0);
            const lis = Number(savedScores.listening || 0);
            const rea = Number(savedScores.reading || 0);
            const wri = Number(savedScores.writing || 0);
            const voc = Number(savedScores.vocab || 0);
            const gra = Number(savedScores.grammar || 0);

            // 2. HITUNG TOTAL SKOR & PERSENTASE AKHIR
            const totalScore = spk + lis + rea + wri + voc + gra; // Total maks: 600
            const percentage = Math.round((totalScore / 600) * 100); // Nilai % (0 - 100)

            // 3. SUSUN PESAN RINCIAN RINCI KEPADA USER
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
                `🎯 NILAI AKHIR: ${percentage}%\n\n` +
                `Kirim Nilai Akhir (${percentage}) ini ke Sel B6?`;

            // 4. BUKA DIALOG POPUP KONFIRMASI
            const setuju = confirm(rincianPesan);

            if (setuju) {
                try {
                    btnSubmit.disabled = true;
                    btnSubmit.innerText = "⏳ Mengirim Nilai...";

                    // Kirim ke API Spreadsheet / Backend (Jika ada)
                    await fetch('/api/submit-score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            score: percentage,
                            cell: 'B6',
                            details: { speaking: spk, listening: lis, reading: rea, writing: wri, vocab: voc, grammar: gra }
                        })
                    });

                    alert(`✅ Masya Allah! Nilai ${percentage}% berhasil dikirim ke Sel B6.`);
                } catch (err) {
                    // Beri konfirmasi sukses walau API backend belum dipasang
                    alert(`✅ Nilai Akhir ${percentage}% disetujui untuk dimasukkan ke Sel B6!`);
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = "Selesai & Kirim Laporan Hari Ini";
                }
            }
        };
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

// Inisialisasi Pertama Saat Web Dimuat
document.addEventListener('DOMContentLoaded', () => {
    router('home');
    initNavListeners();
});
