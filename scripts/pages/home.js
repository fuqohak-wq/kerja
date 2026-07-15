if (!window.globalScores) {
    window.globalScores = { speaking: 0, listening: 0, reading: 0, grammar: 0 };
}

export function renderHome(container, changePageCallback) {
    // 1. Injeksi CSS Murni untuk Mengubah Tampilan Menjadi Cerah & Penuh Warna
    const styleId = 'theme-cerah-inggrisku';
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
            /* Bikin Grid & Kontainer Utama Pas Layar & Berwarna */
            .welcome-section {
                background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%) !important;
                color: white !important;
                padding: 20px !important;
                border-radius: 16px !important;
                box-shadow: 0 4px 15px rgba(26, 115, 232, 0.2) !important;
                text-align: center;
            }
            .welcome-section h2 { color: white !important; font-weight: 800 !important; }
            .welcome-section p { color: #ffeb3b !important; }

            /* Grid Utama */
            .menu-grid {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 12px !important;
                max-width: 850px !important;
                margin: 15px auto !important;
            }

            /* Styling Warna Tiap Card Asli agar Tidak Hitam Putih */
            .menu-grid .menu-card:nth-child(1) { border-left: 5px solid #1a73e8 !important; }
            .menu-grid .menu-card:nth-child(2) { border-left: 5px solid #e91e63 !important; }
            .menu-grid .menu-card:nth-child(3) { border-left: 5px solid #ff9800 !important; }
            .menu-grid .menu-card:nth-child(4) { border-left: 5px solid #9c27b0 !important; }

            /* Animasi transisi Workspace Fokus Layar Penuh */
            .focus-workspace-active {
                background: #f0f4f9 !important;
                min-height: 80vh;
                padding: 20px;
                border-radius: 20px;
            }
        `;
        document.head.appendChild(styleEl);
    }

    // 2. Gunakan setTimeout agar element HTML asli selesai di-render dulu oleh aplikasi Anda
    setTimeout(() => {
        const menuGrid = container.querySelector('.menu-grid');
        if (!menuGrid) return;

        // Cari tahu apakah tombol kustom kita sudah ada, kalau belum baru kita masukkan
        if (!container.querySelector('#eval-panel-custom')) {
            
            // Buat Element Panel Evaluasi Akhir
            const evalPanel = document.createElement('div');
            evalPanel.id = 'eval-panel-custom';
            evalPanel.style.cssText = 'max-width: 850px; margin: 20px auto; background: #fff; padding: 15px; border-radius: 16px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.04); border: 2px dashed #1a73e8;';
            evalPanel.innerHTML = `
                <h4 style="margin: 0 0 5px 0; color: #1a73e8; font-size: 1rem;">🏁 Evaluasi Akhir Belajar Hari Ini?</h4>
                <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #5f6368;">Hitung akumulasi seluruh nilai Anda dan kirim datanya langsung ke Google Sheet B6.</p>
                <button id="btn-submit-all-sessions" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; border: none; padding: 10px 25px; border-radius: 25px; font-size: 0.9rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(26,115,232,0.3);">Saya Selesai Ujian Hari Ini 🚀</button>
            `;
            
            // Masukkan panel tepat di bawah grid menu utama tanpa merusak menu
            menuGrid.parentNode.insertBefore(evalPanel, menuGrid.nextSibling);

            // Pasang Logika Klik Tombol Kirim Nilai
            container.querySelector('#btn-submit-all-sessions').onclick = async (e) => {
                const btn = e.target;
                const scores = window.globalScores;
                
                // Kalkulasi rata-rata nilai akumulasi
                const finalCalculatedScore = Math.round((scores.speaking + scores.listening + scores.reading + scores.grammar) / 4);

                if (!confirm(`Konfirmasi Selesai Ujian?\n\nRincian Nilai:\n- Speaking: ${scores.speaking}\n- Listening: ${scores.listening}\n- Reading: ${scores.reading}\n- Grammar: ${scores.grammar}\n\nRata-rata Rerata: ${finalCalculatedScore}\n\nNilai akan dikirim ke spreadsheet tab DASHBOARD kolom B6.`)) {
                    return;
                }

                btn.disabled = true;
                btn.innerText = "⏳ Mengirim Nilai...";

                try {
                    const res = await fetch('/api/submit-score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ finalScore: finalCalculatedScore })
                    });
                    
                    const result = await res.json();
                    if (result.success) {
                        alert(`🚀 Sukses! Nilai (${finalCalculatedScore}) berhasil masuk ke Spreadsheet Tab DASHBOARD kolom B6.`);
                    } else {
                        throw new Error(result.error || 'Server error.');
                    }
                } catch (err) {
                    alert(`⚠️ Gagal Mengirim Nilai!\nCatatan: Pastikan Anda sudah mengisi Environment Variables Google di Vercel.\n\nDetail Error: ${err.message}`);
                } finally {
                    btn.disabled = false;
                    btn.innerText = "Saya Selesai Ujian Hari Ini 🚀";
                }
            };
        }
    }, 100);
}
