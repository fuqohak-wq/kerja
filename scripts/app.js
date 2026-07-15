// Mengimpor komponen halaman secara eksplisit dan aman
import { renderHome } from './pages/home.js';
import { renderReading } from './pages/reading.js';

// State global aplikasi
const appState = {
    currentPage: 'home',
    user: {
        level: 'A1',
        streak: 3
    }
};

// Fungsi Router utama
function router(page) {
    appState.currentPage = page;
    const appContent = document.getElementById('app-content');
    
    if (!appContent) return; // Guard clause jika elemen belum dimuat
    appContent.innerHTML = '';

    switch (page) {
        case 'home':
            renderHome(appContent);
            initMenuListeners();
            break;
        case 'progress':
            appContent.innerHTML = `
                <div class="welcome-section">
                    <h2>📊 Progress Dashboard</h2>
                    <p>Fitur analitik grafik perkembangan akan hadir di tahap berikutnya.</p>
                </div>`;
            break;
        case 'settings':
            appContent.innerHTML = `
                <div class="welcome-section">
                    <h2>⚙️ Pengaturan</h2>
                    <p>Fitur ganti level (A1-C2) akan hadir di tahap berikutnya.</p>
                </div>`;
            break;
        case 'reading':
            renderReading(appContent);
            break;
        case 'speaking':
        case 'listening':
        case 'writing':
            renderWriting(appContent);
            break;            appContent.innerHTML = `
                <div class="welcome-section">
                    <h2>${page.toUpperCase()}</h2>
                    <p>Fitur AI untuk ${page} sedang disiapkan untuk integrasi Gemini API.</p>
                    <button id="btn-back" class="action-btn" style="margin-top:20px;">Kembali ke Beranda</button>
                </div>`;
            const btnBack = document.getElementById('btn-back');
            if (btnBack) btnBack.addEventListener('click', () => router('home'));
            break;
        default:
            renderHome(appContent);
            initMenuListeners();
    }
}

// Inisialisasi klik menu utama
function initMenuListeners() {
    const menuCards = document.querySelectorAll('.menu-card');
    menuCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetSkill = card.getAttribute('data-skill');
            if (targetSkill) router(targetSkill);
        });
    });
}

// Inisialisasi navigasi bawah
function initNavListeners() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            const clickedItem = e.currentTarget;
            clickedItem.classList.add('active');
            
            const targetPage = clickedItem.getAttribute('data-page');
            if (targetPage) router(targetPage);
        });
    });
}

// Jalankan ketika DOM sudah siap
document.addEventListener('DOMContentLoaded', () => {
    router('home');
    initNavListeners();
});
import { renderWriting } from './pages/writing.js';
