// Tambahkan import di bagian paling atas
import { renderReading } from './pages/reading.js';

// ... kode sebelumnya di app.js ...
// Di dalam fungsi router(page), ganti case 'reading':
        case 'reading':
            renderReading(appContent);
            break;
// Mengimpor komponen halaman (akan kita buat di tahap berikutnya)
import { renderHome } from './pages/home.js';

// State global aplikasi sederhana
const appState = {
    currentPage: 'home',
    user: {
        level: 'A1',
        streak: 3
    }
};

// Fungsi Router untuk mengatur halaman yang tampil
function router(page) {
    appState.currentPage = page;
    const appContent = document.getElementById('app-content');
    
    // Reset konten
    appContent.innerHTML = '';

    switch (page) {
        case 'home':
            renderHome(appContent);
            initMenuListeners();
            break;
        case 'progress':
            appContent.innerHTML = `<div class="welcome-section"><h2>📊 Progress</h2><p>Fitur Progress akan hadir di tahap berikutnya.</p></div>`;
            break;
        case 'settings':
            appContent.innerHTML = `<div class="welcome-section"><h2>⚙️ Settings</h2><p>Fitur Settings akan hadir di tahap berikutnya.</p></div>`;
            break;
        // Halaman fitur skill
        case 'speaking':
        case 'listening':
        case 'reading':
        case 'writing':
            appContent.innerHTML = `<div class="welcome-section"><h2>${page.toUpperCase()}</h2><p>Fitur ini sedang disiapkan untuk tahap selanjutnya.</p><button id="btn-back" style="margin-top:20px; padding: 10px 20px; background: var(--primary-color); color:white; border:none; border-radius:8px;">Kembali ke Beranda</button></div>`;
            document.getElementById('btn-back').addEventListener('click', () => router('home'));
            break;
        default:
            renderHome(appContent);
    }
}

// Inisialisasi klik pada Menu Utama (Speaking, Listening, dll)
function initMenuListeners() {
    const menuCards = document.querySelectorAll('.menu-card');
    menuCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetSkill = card.getAttribute('data-skill');
            router(targetSkill);
        });
    });
}

// Inisialisasi klik pada Bottom Navigation
function initNavListeners() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            const clickedItem = e.currentTarget;
            clickedItem.classList.add('active');
            
            const targetPage = clickedItem.getAttribute('data-page');
            router(targetPage);
        });
    });
}

// Event saat aplikasi pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    router('home');
    initNavListeners();
});
