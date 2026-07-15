// Inisialisasi Score Holder Global jika belum ada di aplikasi
if (!window.globalScores) {
    window.globalScores = { speaking: 100, listening: 0, reading: 0, grammar: 0 };
}

export function renderHome(container, changePageCallback) {
    // 1. Suntik Style CSS agar UI menjadi cerah, penuh warna, dan pas satu layar
    const styleId = 'custom-home-theme-styles';
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
            :root {
                --primary-gradient: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
            }
            #home-main-dashboard {
                animation: fadeInHome 0.3s ease-in-out;
            }
            .full-screen-container {
                background: #f0f4f9;
                min-height: 80vh;
                padding: 20px;
                border-radius: 20px;
                text-align: left;
                animation: fadeInHome 0.3s ease-in-out;
            }
            @keyframes fadeInHome { from { opacity: 0; } to { opacity: 1; } }
        `;
        document.head.appendChild(styleEl);
    }

    // 2. KONTROL STRUKTUR DOM: Cek jika element pembungkus (wrapper) sudah ada atau belum
    let mainDashboard = container.querySelector('#home-main-dashboard');
    
    // Jika belum ada wrapper kustom kita, tandanya ini pemuatan awal halaman
    if (!mainDashboard) {
        // Ambil elemen teks selamat datang bawaan jika ada untuk dipercantik
        const welcomeSec = container.querySelector('.welcome-section');
        if (welcomeSec) {
            welcomeSec.style.background = 'var(--primary-gradient)';
            welcomeSec.style.color = 'white';
            welcomeSec.style.padding = '20px';
            welcomeSec.style.borderRadius = '16px';
            welcomeSec.style.boxShadow = '0 4px 15px rgba(26, 115, 232, 0.2)';
            welcomeSec.innerHTML = `<h2 style="margin: 0; font-size: 1.8rem; font-weight: 800;">Inggris<span style="color: #ffeb3b;">ku</span> Academy</h2>
                                    <p style="margin: 5px 0 0 0; font-size: 0.95rem; opacity: 0.9;">Pusat Pelatihan Mandiri AI — Semua Modul Pas Satu Layar</p>`;
        }

        // Ambil grid menu bawaan asli tempat 4 menu utama berada
        const menuGrid = container.querySelector('.menu-grid');
        if (menuGrid) {
            // Ubah style grid asli menjadi super compact dan muat satu layar
            menuGrid.style.display = 'grid';
            menuGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            menuGrid.style.gap = '12px';
            menuGrid.style.maxWidth = '850px';
            menuGrid.style.margin = '0 auto 15px auto';
            menuGrid.style.padding = '5px';

            // Warnai ulang 4 tombol bawaan asli agar cerah penuh warna
            const nativeCards = menuGrid.querySelectorAll('.menu-card');
            nativeCards.forEach((card, index) => {
                card.style.padding = '15px';
                card.style.borderRadius = '16px';
                card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
                card.style.transition = 'transform 0.2s';
                
                // Beri aksen border warna cerah yang berbeda di setiap menu
                if (index === 0) card.style.borderLeft = '5px solid #1a73e8';
                if (index === 1) card.style.borderLeft = '5px solid #e91e63';
                if (index === 2) card.style.borderLeft = '5px solid #ff9800';
                if (index === 3) card.style.borderLeft = '5px solid #9c27b0';
            });

            // HAPUS tombol Progress & Settings lama yang ada di dalam Grid jika tidak sengaja ter-render ulang
            nativeCards.forEach(card => {
                const text = card.innerText.toLowerCase();
                if (text.includes('progress') || text.includes('settings') || text.includes('setting')) {
                    card.remove();
                }
            });

            // SUNTIK 2 Tombol Modul Baru Secara Dinamis Ke Dalam Grid Asli (Tanpa menghancurkan menu lama)
            if (!container.querySelector('#go-vocab')) {
                const vocabCard = document.createElement('div');
                vocabCard.className = 'menu-card';
                vocabCard.id = 'go-vocab';
                vocabCard.style.cssText = 'background: linear-gradient(135deg, #e8f0fe 0%, #c2e7ff 100%); padding: 15px; border-radius: 16px; cursor: pointer; text-align: center;';
                vocabCard.innerHTML = `<div style="font-size: 2.2rem; margin-bottom: 3px;">📚</div>
                                       <h4 style="margin: 0; color: #0d47a1; font-size: 1rem;">Daily Vocab</h4>
                                       <p style="color: #185abc; font-size: 0.75rem; margin: 2px 0 0 0; font-weight: bold;">10 Kata & Kuis</p>`;
                menuGrid.appendChild(vocabCard);
            }

            if (!container.querySelector('#go-grammar')) {
                const grammarCard = document.createElement('div');
                grammarCard.className = 'menu-card';
                grammarCard.id = 'go-grammar';
                grammarCard.style.cssText = 'background: linear-gradient(135deg, #e6f4ea 0%, #c4eed0 100%); padding: 15px; border-radius: 16px; cursor: pointer; text-align: center;';
                grammarCard.innerHTML = `<div style="font-size: 2.2rem; margin-bottom: 3px;">⚙️</div>
                                         <h4 style="margin: 0; color: #1b5e20; font-size: 1rem;">Grammar Booster</h4>
                                         <p style="color: #137333; font-size: 0.75rem; margin: 2px 0 0 0; font-weight: bold;">Pola Kalimat Advance</p>`;
                menuGrid.appendChild(grammarCard);
            }
        }

        // Bungkus seluruh konten beranda ke dalam id #home-main-dashboard
        const originalContent = container.innerHTML;
        container.innerHTML = `
            <div id="home-main-dashboard">${originalContent}</div>
            
            <div id="evaluation-panel" style="max-width: 850px; margin: 15px auto; background: #fff; padding: 15px; border-radius: 16px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.04); border: 2px dashed #1a73e8;">
                <h4 style="margin: 0 0 5px 0; color: #1a73e8; font-size: 1rem;">🏁 Evaluasi Akhir Belajar Hari Ini?</h4>
                <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #5f6368;">Hitung akumulasi seluruh nilai Anda dan kirim datanya langsung ke Google Sheet B6.</p>
                <button id="btn-submit-all-sessions" style="background: var(--primary-gradient); color: white; border: none; padding: 10px 25px; border-radius: 25px; font-size: 0.9rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(26,115,232,0.3);">Saya Selesai Ujian Hari Ini 🚀</button>
            </div>

            <div id="home-focus-workspace" class="full-screen-container" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
                    <button id="btn-back-to-dash" style="background: #e2e8f0; border: none; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-weight: bold; color: #4a5568; font-size:0.85rem;">⬅️ Kembali ke Dashboard</button>
                    <h3 id="workspace-title" style="margin:0; color:#1a73e8; font-size: 1.1rem;">Materi Belajar</h3>
                </div>
                <div id="workspace-content"></div>
            </div>
        `;
    }

    // Refresh pointer element pasca pembungkusan DOM
    mainDashboard = container.querySelector('#home-main-dashboard');
    const focusWorkspace = container.querySelector('#home-focus-workspace');
    const workspaceContent = container.querySelector('#workspace-content');
    const workspaceTitle = container.querySelector('#workspace-title');
    
    container.querySelector('#btn-back-to-dash').onclick = () => {
        focusWorkspace.style.display = 'none';
        mainDashboard.style.display = 'block';
        const evalPanel = container.querySelector('#evaluation-panel');
        if (evalPanel) evalPanel.style.display = 'block';
    };

    // --- LOGIKA LAYAR PENUH: DAILY VOCABULARY ---
    const vocabBtn = container.querySelector('#go-vocab');
    if (vocabBtn) {
        vocabBtn.onclick = async () => {
            mainDashboard.style.display = 'none';
            const evalPanel = container.querySelector('#evaluation-panel');
            if (evalPanel) evalPanel.style.display = 'none';
            focusWorkspace.style.display = 'block';
            workspaceTitle.innerText = "📚 Kelas Fokus: Daily Vocabulary";
            workspaceContent.innerHTML = `<div style="text-align:center; padding:40px; font-size:1.1rem; color:#1a73e8;">⏳ AI sedang merumuskan 10 kosakata Oxford baru...</div>`;

            try {
                const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'vocab'}) });
                const text = await res.text();
                // Sanitasi berlapis untuk mencegah JSON Parse Error
                const cleanText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1).replace(/\n/g, ' ').replace(/\r/g, ' ');
                const data = JSON.parse(cleanText);

                let html = `
                    <div style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        <h3 style="color:#0d47a1; margin-top:0; font-size:1.2rem; border-bottom:2px solid #e8f0fe; padding-bottom:8px;">📋 10 Kosakata Baru Hari Ini</h3>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 20px;">
                            ${data.words.map((w, i) => `
                                <div style="background:#f8f9fa; padding:10px; border-radius:8px; border-top:3px solid #1a73e8;">
                                    <strong style="font-size:0.95rem; color:#1a73e8;">${i+1}. ${w.word}</strong><br>
                                    <span style="font-size:0.85rem; color:#202124;">Arti: ${w.meaning}</span><br>
                                    <small style="color:#5f6368; font-style:italic; display:block; margin-top:4px;">Ex: ${w.example}</small>
                                </div>
                            `).join('')}
                        </div>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                        ${renderWorkspaceQuiz(data.quiz)}
                    </div>
                `;
                workspaceContent.innerHTML = html;
                bindWorkspaceQuizEvents(data.quiz, 'vocab');
            } catch (e) {
                workspaceContent.innerHTML = `<p style="color:red; text-align:center;">⚠️ AI sedang sibuk. Silakan klik tombol kembali di atas dan buka ulang menu.</p>`;
            }
        };
    }

    // --- LOGIKA LAYAR PENUH: GRAMMAR BOOSTER ---
    const grammarBtn = container.querySelector('#go-grammar');
    if (grammarBtn) {
        grammarBtn.onclick = async () => {
            mainDashboard.style.display = 'none';
            const evalPanel = container.querySelector('#evaluation-panel');
            if (evalPanel) evalPanel.style.display = 'none';
            focusWorkspace.style.display = 'block';
            workspaceTitle.innerText = "⚙️ Kelas Fokus: Grammar Booster";
            workspaceContent.innerHTML = `<div style="text-align:center; padding:40px; font-size:1.1rem; color:#1b5e20;">⏳ AI sedang memformulasikan pola kalimat baru...</div>`;

            try {
                const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'grammar'}) });
                const text = await res.text();
                const cleanText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1).replace(/\n/g, ' ').replace(/\r/g, ' ');
                const data = JSON.parse(cleanText);

                let html = `
                    <div style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #e6f4ea 0%, #ffffff 100%); padding: 15px; border-radius: 12px; border-left: 6px solid #34a853; margin-bottom: 15px;">
                            <h3 style="margin: 0 0 5px 0; color: #137333; font-size:1.2rem;">Topik: ${data.topic}</h3>
                            <p style="margin: 0; font-size: 0.95rem; line-height: 1.4; color:#202124;">${data.explanation}</p>
                        </div>
                        <div style="background: #f1f3f4; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
                            <strong style="color:#5f6368; font-size:0.75rem; display:block; margin-bottom:2px;">RUMUS & CONTOH PENGGUNAAN:</strong>
                            <code style="font-size: 0.95rem; color: #b06000; font-weight: bold; display: block; font-family: monospace;">${data.formula}</code>
                        </div>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                        ${renderWorkspaceQuiz(data.quiz)}
                    </div>
                `;
                workspaceContent.innerHTML = html;
                bindWorkspaceQuizEvents(data.quiz, 'grammar');
            } catch (e) {
                workspaceContent.innerHTML = `<p style="color:red; text-align:center;">⚠️ Sistem AI sibuk. Silakan kembali dan muat ulang beberapa saat lagi.</p>`;
            }
        };
    }

    function renderWorkspaceQuiz(quiz) {
        return `
            <div style="margin-top:10px;">
                <h4 style="color:#1a73e8; font-size:1.05rem; margin:0 0 8px 0;">🎯 Kuis Uji Pemahaman:</h4>
                <p style="font-size:0.95rem; margin-bottom:10px; font-weight:600; color:#202124;">${quiz.question}</p>
                <div style="display:grid; grid-template-columns: 1fr; gap:8px; max-width:550px;">
                    ${quiz.options.map(o => `<button class="workspace-opt-btn" data-val="${o}" style="text-align:left; padding:10px 14px; border:1px solid #dadce0; background:white; border-radius:8px; font-size:0.9rem; cursor:pointer; transition:all 0.15s;">${o}</button>`).join('')}
                </div>
                <div id="workspace-quiz-expl" style="margin-top:12px; max-width:550px;"></div>
            </div>
        `;
    }

    function bindWorkspaceQuizEvents(quiz, scoreKey) {
        const btns = workspaceContent.querySelectorAll('.workspace-opt-btn');
        const explDiv = workspaceContent.querySelector('#workspace-quiz-expl');

        btns.forEach(btn => {
            btn.onclick = (e) => {
                const selected = e.target.getAttribute('data-val');
                btns.forEach(b => b.disabled = true);

                if (selected === quiz.answer) {
                    window.globalScores[scoreKey] = 100;
                    e.target.style.background = '#e6f4ea';
                    e.target.style.borderColor = '#34a853';
                    e.target.style.color = '#137333';
                    explDiv.innerHTML = `<div style="padding:10px; background:#f4faf6; border-left:5px solid #34a853; border-radius:8px; font-size:0.85rem;"><strong>🎉 Jawaban Benar!</strong><br>${quiz.explanation}</div>`;
                } else {
                    window.globalScores[scoreKey] = 0;
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    e.target.style.color = '#c5221f';
                    explDiv.innerHTML = `<div style="padding:10px; background:#fdf5f5; border-left:5px solid #ea4335; border-radius:8px; font-size:0.85rem;"><strong>❌ Kurang Tepat.</strong> Jawaban: <strong>${quiz.answer}</strong><br>${quiz.explanation}</div>`;
                }
            };
        });
    }

    // --- BUTTON EVALUASI: HITUNG RATA-RATA & TEMBAK KE SPREADSHEET B6 ---
    const submitAllBtn = container.querySelector('#btn-submit-all-sessions');
    if (submitAllBtn) {
        submitAllBtn.onclick = async (e) => {
            const btn = e.target;
            const scores = window.globalScores;
            
            // Mengalkulasi nilai rata-rata dari seluruh sesi belajar hari ini
            const finalCalculatedScore = Math.round((scores.speaking + scores.listening + scores.reading + scores.grammar) / 4);

            if (!confirm(`Konfirmasi Selesai Ujian?\n\nRincian Nilai Sesi Anda:\n- Speaking: ${scores.speaking}\n- Listening: ${scores.listening}\n- Reading: ${scores.reading}\n- Grammar: ${scores.grammar}\n\nRata-rata Nilai: ${finalCalculatedScore}\n\nNilai akan langsung dikirim ke spreadsheet tab DASHBOARD di kolom B6.`)) {
                return;
            }

            btn.disabled = true;
            btn.innerText = "⏳ Mengirim Nilai ke Sheet...";

            try {
                // Tembak nilai akhir ke API endpoint
                const res = await fetch('/api/submit-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ finalScore: finalCalculatedScore })
                });
                const result = await res.json();

                if (result.success) {
                    alert(`🚀 Sukses! Nilai akumulasi hari ini (${finalCalculatedScore}) berhasil masuk ke Spreadsheet Tab DASHBOARD di kolom B6.`);
                } else {
                    throw new Error(result.error || 'Terjadi kesalahan sistem pengiriman.');
                }
            } catch (err) {
                alert(`⚠️ Gagal Mengirim Nilai: ${err.message}`);
            } finally {
                btn.disabled = false;
                btn.innerText = "Saya Selesai Ujian Hari Ini 🚀";
            }
        };
    }
}
