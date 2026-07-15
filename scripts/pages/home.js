/**
 * Merender halaman beranda ke dalam kontainer utama
 * @param {HTMLElement} container 
 */
export function renderHome(container) {
    const homeHTML = `
        <div class="welcome-section">
            <h2>Halo, Pelajar! 👋</h2>
            <p>Pilih skill yang ingin kamu latih hari ini bersama AI Tutor kamu.</p>
        </div>

        <div class="menu-grid">
            <div class="menu-card" data-skill="speaking">
                <span class="menu-icon">🎤</span>
                <span class="menu-title">Speaking</span>
            </div>
            <div class="menu-card" data-skill="listening">
                <span class="menu-icon">🎧</span>
                <span class="menu-title">Listening</span>
            </div>
            <div class="menu-card" data-skill="reading">
                <span class="menu-icon">📖</span>
                <span class="menu-title">Reading</span>
            </div>
            <div class="menu-card" data-skill="writing">
                <span class="menu-icon">✍️</span>
                <span class="menu-title">Writing</span>
            </div>
            <div class="menu-card" data-skill="progress">
                <span class="menu-icon">📊</span>
                <span class="menu-title">Progress</span>
            </div>
            <div class="menu-card" data-skill="settings">
                <span class="menu-icon">⚙️</span>
                <span class="menu-title">Settings</span>
            </div>
        </div>
    `;
    container.innerHTML = homeHTML;
}
