if (!window.globalScores) {
    window.globalScores = { speaking: 0, listening: 0, reading: 0, grammar: 0 };
}

export function renderHome(container, changePageCallback) {
    // 1. INJEKSI CSS: Mengubah tampilan jadi Biru Cerah, Penuh Warna, Pas Satu Layar & Menambah Tombol secara Visual
    const styleId = 'theme-cerah-inggrisku-final';
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
            /* 1. Header Utama dibuat Biru Cerah Gradasi Modern */
            .welcome-section {
                background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%) !important;
                color: white !important;
                padding: 22px !important;
                border-radius: 16px !important;
                box-shadow: 0 4px 15px rgba(26, 115, 232, 0.2) !important;
                text-align: center;
            }
            .welcome-section h2 { color: white !important; font-weight: 800 !important; }
            .welcome-section p { color: #ffeb3b !important; opacity: 1 !important; }

            /* 2. Grid Menu dibuat Rapi & Pas di Layar */
            .menu-grid {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 12px !important;
                max-width: 850px !important;
                margin: 15px auto !important;
            }

            /* 3. Beri Warna Cerah Menarik pada Border 4 Menu Utama Anda */
            .menu-grid .menu-card:nth-child(1) { border-left: 5px solid #1a73e8 !important; background: #ffffff !important; }
            .menu-grid .menu-card:nth-child(2) { border-left: 5px solid #e91e63 !important; background: #ffffff !important; }
            .menu-grid .menu-card:nth-child(3) { border-left: 5px solid #ff9800 !important; background: #ffffff !important; }
            .menu-grid .menu-card:nth-child(4) { border-left: 5px solid #9c27b0 !important; background: #ffffff !important; }
            
            /* Sembunyikan tombol progress/settings bawaan yang ada di dalam grid menu jika double */
            .menu-grid .menu-card:nth-child(5), 
            .menu-grid .menu-card:nth-child(6) { 
                display: none !important; 
            }

            /* 4. Membuat Tombol Evaluasi via CSS pseudo-element di bawah grid */
            .menu-grid::after {
                content: "🏁 Evaluasi Akhir Belajar Hari Ini? \\A Klik di sini untuk hitung akumulasi nilai dan kirim langsung ke Google Sheet B6.";
                white-space: pre-wrap;
                grid-column: span 2;
                background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
                color: white;
                padding: 15px;
                border-radius: 16px;
                text-align: center;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(26,115,232,0.3);
                margin-top: 10px;
                transition: opacity 0.2s;
                font-size: 0.95rem;
            }
            .menu-grid::after:hover {
                opacity: 0.9;
            }
        `;
        document.head.appendChild(styleEl);
    }

    // 2. LOGIKA KLIK AMAN: Gunakan Event Delegation pada container agar tidak bentrok dengan Router
    container.onclick = async (e) => {
        // Cek apakah yang diklik adalah area tombol evaluasi (::after dari menu-grid)
        const rect = container.querySelector('.menu-grid')?.getBoundingClientRect();
        
        // Deteksi klik pada bagian bawah menu-grid tempat tombol ::after berada
        if (e.target.classList.contains('menu-grid') && e.offsetY > (rect.height - 80)) {
            const scores = window.globalScores;
            const finalCalculatedScore = Math.round((scores.speaking + scores.listening + scores.reading + scores.grammar) / 4);

            if (!confirm(`Konfirmasi Selesai Ujian?\n\nRincian Skor Anda:\n- Speaking: ${scores.speaking}\n- Listening: ${scores.listening}\n- Reading: ${scores.reading}\n- Grammar: ${scores.grammar}\n\nRata-rata Nilai: ${finalCalculatedScore}\n\nNilai akan langsung dikirim ke Google Sheets tab DASHBOARD kolom B6.`)) {
                return;
            }

            try {
                const res = await fetch('/api/submit-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ finalScore: finalCalculatedScore })
                });
                
                const result = await res.json();
                if (result.success) {
                    alert(`🚀 Sukses! Nilai total (${finalCalculatedScore}) berhasil masuk ke Spreadsheet Tab DASHBOARD kolom B6.`);
                } else {
                    throw new Error(result.error || 'Terjadi masalah internal server.');
                }
            } catch (err) {
                alert(`⚠️ Nilai Gagal Terkirim!\n\nPenyebab Utama: Anda kemungkinan belum mengisi Environment Variables Google Credentials di dashboard Vercel Anda.\n\nDetail Error: ${err.message}`);
            }
        }
    };
}
