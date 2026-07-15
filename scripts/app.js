import { renderHome } from './pages/home.js';
import { renderReading } from './pages/reading.js';
import { renderWriting } from './pages/writing.js';
import { renderListening } from './pages/listening.js';
import { renderSpeaking } from './pages/speaking.js';

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
            appContent.innerHTML = `
                <div class="welcome-section">
                    <h2>📊 Dashboard Progress</h2>
                    <div class="reading-container">
                        <p>🔥 <strong>Streak Harian:</strong> 3 Hari</p>
                        <p>🎯 <strong>Target Belajar:</strong> Lancar Percakapan Roleplay</p>
                        <hr style="margin:15px 0; border:0; border-top:1px solid #ddd;">
                        <p>⚡ Statistik per Skill akan otomatis diperbarui setelah riwayat terisi.</p>
                    </div>
                </div>`;
            break;
        case 'settings':
            appContent.innerHTML = `
                <div class="welcome-section">
                    <h2>⚙️ Pengaturan Akun</h2>
                    <div class="reading-container">
                        <label>Pilih Level Target Kamu:</label>
                        <select class="writing-textarea" style="height:50px; margin-top:10px;"><option>A1</option><option>A2</option><option selected>B1</option><option>B2</option><option>C1</option></select>
                        <button onclick="alert('Pengaturan disimpan!')" class="action-btn">Simpan</button>
                    </div>
                </div>`;
            break;
        default:
            renderHome(appContent);
            initMenuListeners();
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
