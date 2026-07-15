export async function renderProgress(container) {
    container.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; padding: 15px; box-sizing: border-box;">
            <div style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 20px; border-radius: 16px; margin-bottom: 20px; text-align:center;">
                <h2 style="margin:0; color:white !important;">📊 Dashboard Progress</h2>
                <p style="margin:5px 0 0 0; color:#ffeb3b !important; font-size:0.9rem;">Statistik dan grafik kemampuan belajar Anda secara real-time.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: #fff; padding: 20px; border-radius: 14px; text-align: center; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <span style="font-size: 2rem;">🔥</span>
                    <h3 id="streak-count" style="margin: 5px 0 0 0; color: #1a73e8;">Memuat...</h3>
                    <p style="margin: 0; color: #5f6368; font-size: 0.85rem;">Streak Harian</p>
                </div>
                <div style="background: #fff; padding: 20px; border-radius: 14px; text-align: center; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <span style="font-size: 2rem;">🏆</span>
                    <h3 id="latest-score-b6" style="margin: 5px 0 0 0; color: #34a853;">Memuat...</h3>
                    <p style="margin: 0; color: #5f6368; font-size: 0.85rem;">Skor Terakhir (Sheet B6)</p>
                </div>
            </div>

            <div style="background: #fff; padding: 20px; border-radius: 16px; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #202124; font-size: 1.1rem; border-bottom: 2px solid #f1f3f4; padding-bottom: 10px;">📈 Grafik Perkembangan Nilai</h3>
                <div id="chart-container" style="min-height: 180px; display: flex; align-items: flex-end; justify-content: space-around; gap: 10px; padding-top: 20px; border-bottom: 2px solid #ddd;">
                    </div>
                <p style="text-align: center; color: #70757a; font-size: 0.8rem; margin-top: 15px;">Grafik diperbarui otomatis berdasarkan riwayat sesi belajar Anda.</p>
            </div>
        </div>
    `;

    try {
        const res = await fetch('/api/submit-score');
        const data = await res.json();

        // Update nilai Streak & Skor B6 dari server/Google Sheet
        container.querySelector('#streak-count').innerText = `${data.streak || 1} Hari`;
        container.querySelector('#latest-score-b6').innerText = data.scoreB6 || 0;

        // Render Grafik Batang (Bar Chart)
        const chartArea = container.querySelector('#chart-container');
        if (data.history && data.history.length > 0) {
            chartArea.innerHTML = data.history.map(item => `
                <div style="display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; flex: 1;">
                    <span style="font-size: 0.75rem; font-weight: bold; color: #1a73e8; margin-bottom: 5px;">${item.score}</span>
                    <div style="width: 100%; max-width: 40px; background: linear-gradient(to top, #1a73e8, #4285f4); border-radius: 6px 6px 0 0; height: ${Math.max(item.score, 15)}%;"></div>
                    <span style="font-size: 0.7rem; color: #5f6368; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px;">${item.date}</span>
                </div>
            `).join('');
        } else {
            chartArea.innerHTML = `<p style="color: #70757a; width: 100%; text-align: center; padding: 40px 0;">Belum ada data grafik. Selesaikan latihan dan klik "Saya Selesai Ujian Hari Ini" di beranda!</p>`;
        }

    } catch (err) {
        container.querySelector('#streak-count').innerText = "1 Hari";
        container.querySelector('#latest-score-b6').innerText = "0";
        container.querySelector('#chart-container').innerHTML = `<p style="color: red; text-align: center; padding: 40px 0;">Gagal memuat data progress dari server.</p>`;
    }
}
