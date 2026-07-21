import { renderHome } from './pages/home.js';
import { renderReading } from './pages/reading.js';
import { renderWriting } from './pages/writing.js';
import { renderListening } from './pages/listening.js';
import { renderSpeaking } from './pages/speaking.js';

// =========================================================
// STATE & PENYIMPANAN SKOR GLOBAL (6 MENU LATIHAN)
// =========================================================
window.globalScores = {
    speaking: 0,
    listening: 0,
    reading: 0,
    writing: 0,
    vocab: 0,
    grammar: 0
};

// Fungsi global untuk memperbarui nilai dari modul mana saja
window.updateGlobalScore = function(skillName, scoreValue) {
    if (window.globalScores.hasOwnProperty(skillName)) {
        window.globalScores[skillName] = Math.min(100, Math.max(0, Number(scoreValue) || 0));
        console.log(`[Skor Updated] ${skillName}: ${window.globalScores[skillName]}`);
    }
};

// Menghitung total nilai harian seimbang dari ke-6 menu (Maksimal 100)
function calculateTotalDailyScore() {
    const scores = Object.values(window.globalScores);
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
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
                    <div class="reading-container">
                        <p>🔥 <strong>Streak Harian:</strong> 3 Hari</p>
                        <p>🎯 <strong>Estimasi Total Nilai Hari Ini:</strong> ${currentTotal} / 100</p>
                        <hr style="margin:15px 0; border:0; border-top:1px solid #ddd;">
                        <h4>Detail Per Skill:</h4>
                        <ul style="text-align:left; line-height: 1.8;">
                            <li>🎤 Speaking: ${window.globalScores.speaking} / 100</li>
                            <li>🎧 Listening: ${window.globalScores.listening} / 100</li>
                            <li>📖 Reading: ${window.globalScores.reading} / 100</li>
                            <li>✍️ Writing: ${window.globalScores.writing} / 100</li>
                            <li>📚 Daily Vocab: ${window.globalScores.vocab} / 100</li>
                            <li>⚙️ Grammar: ${window.globalScores.grammar} / 100</li>
                        </ul>
                    </div>
                </div>`;
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
    const btnSubmit = document.querySelector('.main-content .action-btn, #btn-submit-eval');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', () => {
            const total = calculateTotalDailyScore();
            alert(`🎉 Evaluasi Selesai!\n\nTotal Akumulasi Nilai Latihan Hari Ini: ${total} / 100\n\nDetail:\n- Speaking: ${window.globalScores.speaking}\n- Listening: ${window.globalScores.listening}\n- Reading: ${window.globalScores.reading}\n- Writing: ${window.globalScores.writing}\n- Vocab: ${window.globalScores.vocab}\n- Grammar: ${window.globalScores.grammar}`);
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
