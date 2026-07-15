// Inisialisasi Score Holder Global jika belum ada
if (!window.globalScores) {
    window.globalScores = { speaking: 100, listening: 0, reading: 0, grammar: 0 };
}

export function renderHome(container, changePageCallback) {
    // Inject Style Warna Cerah & Animasi agar segar dan tidak hitam putih
    const styleId = 'custom-home-theme-styles';
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
            :root {
                --primary-gradient: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
                --accent-blue: #e8f0fe;
                --card-shadow: 0 4px 15px rgba(26, 115, 232, 0.15);
            }
            .menu-card {
                border: none !important;
                box-shadow: 0 4px 10px rgba(0,0,0,0.06);
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            .menu-card:hover {
                transform: translateY(-4px) !important;
                box-shadow: 0 8px 25px rgba(26, 115, 232, 0.25) !important;
            }
            .full-screen-container {
                background: #f0f4f9;
                min-height: 80vh;
                padding: 20px;
                border-radius: 20px;
                animation: fadeInHome 0.3s ease-in-out;
            }
            @keyframes fadeInHome { from { opacity: 0; } to { opacity: 1; } }
        `;
        document.head.appendChild(styleEl);
    }

    container.innerHTML = `
        <div id="home-main-dashboard">
            <div class="welcome-section" style="background: var(--primary-gradient); color: white; padding: 25px; border-radius: 16px; margin-bottom: 20px; text-align: center; box-shadow: var(--card-shadow);">
                <h2 style="margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: 0.5px;">Inggris<span style="color: #ffeb3b;">ku</span> Academy</h2>
                <p style="margin: 6px 0 0 0; font-size: 0.95rem; opacity: 0.9;">Pusat Pelatihan Mandiri AI — Semua Modul Pas Satu Layar</p>
            </div>

            <div class="menu-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; max-width: 850px; margin: 0 auto 25px auto; padding: 5px; box-sizing: border-box;">
                
                <div class="menu-card main-feature-card" data-targetpage="speaking" style="background: #ffffff; padding: 20px; border-radius: 16px; cursor: pointer; text-align: center; border-left: 5px solid #1a73e8 !important;">
                    <div style="font-size: 2.5rem; margin-bottom: 5px;">🎤</div>
                    <h4 style="margin: 0; font-size: 1.1rem; color: #1a73e8;">Speaking Tutor</h4>
                    <p style="color: #5f6368; font-size: 0.8rem; margin-top: 4px;">Praktek Percakapan Suara</p>
                </div>

                <div class="menu-card main-feature-card" data-targetpage="listening" style="background: #ffffff; padding: 20px; border-radius: 16px; cursor: pointer; text-align: center; border-left: 5px solid #e91e63 !important;">
                    <div style="font-size: 2.5rem; margin-bottom: 5px;">🎧</div>
                    <h4 style="margin: 0; font-size: 1.1rem; color: #e91e63;">Listening Practice</h4>
                    <p style="color: #5f6368; font-size: 0.8rem; margin-top: 4px;">Kuis Pemahaman Audio AI</p>
                </div>

                <div class="menu-card main-feature-card" data-targetpage="reading" style="background: #ffffff; padding: 20px; border-radius: 16px; cursor: pointer; text-align: center; border-left: 5px solid #ff9800 !important;">
                    <div style="font-size: 2.5rem; margin-bottom: 5px;">📖</div>
                    <h4 style="margin: 0; font-size: 1.1rem; color: #ff9800;">Reading Academy</h4>
                    <p style="color: #5f6368; font-size: 0.8rem; margin-top: 4px;">Klik & Terjemah Instan</p>
                </div>

                <div class="menu-card main-feature-card" data-targetpage="writing" style="background: #ffffff; padding: 20px; border-radius: 16px; cursor: pointer; text-align: center; border-left: 5px solid #9c27b0 !important;">
                    <div style="font-size: 2.5rem; margin-bottom: 5px;">✍️</div>
                    <h4 style="margin: 0; font-size: 1.1rem; color: #9c27b0;">Writing Corrector</h4>
                    <p style="color: #5f6368; font-size: 0.8rem; margin-top: 4px;">Analisis & Perbaikan Esai</p>
                </div>

                <div class="menu-card dynamic-action-card" id="go-vocab" style="background: linear-gradient(135deg, #e8f0fe 0%, #c2e7ff 100%); padding: 20px; border-radius: 16px; cursor: pointer; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 5px;">📚</div>
                    <h4 style="margin: 0; color: #0d47a1; font-size: 1.1rem;">Daily Vocab</h4>
                    <p style="color: #185abc; font-size: 0.8rem; margin-top: 4px; font-weight: bold;">10 Kata Oxford & Kuis</p>
                </div>

                <div class="menu-card dynamic-action-card" id="go-grammar" style="background: linear-gradient(135deg, #e6f4ea 0%, #c4eed0 100%); padding: 20px; border-radius: 16px; cursor: pointer; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 5px;">⚙️</div>
                    <h4 style="margin: 0; color: #1b5e20; font-size: 1.1rem;">Grammar Booster</h4>
                    <p style="color: #137333; font-size: 0.8rem; margin-top: 4px; font-weight: bold;">Struktur Kalimat Advance</p>
                </div>
            </div>

            <div style="max-width: 850px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 16px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.04); border: 2px dashed #1a73e8;">
                <h4 style="margin: 0 0 8px 0; color: #1a73e8; font-size: 1.1rem;">🏁 Evaluasi Akhir Belajar Hari Ini?</h4>
                <p style="margin: 0 0 15px 0; font-size: 0.85rem; color: #5f6368;">Klik tombol di bawah untuk menghitung rata-rata nilai seluruh sesi hari ini dan mengirimkannya ke Google Sheets.</p>
                <button id="btn-submit-all-sessions" style="background: var(--primary-gradient); color: white; border: none; padding: 12px 30px; border-radius: 25px; font-size: 0.95rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(26,115,232,0.3);">Saya Selesai Ujian Hari Ini 🚀</button>
            </div>
        </div>

        <div id="home-focus-workspace" class="full-screen-container" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">
                <button id="btn-back-to-dash" style="background: #e2e8f0; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; color: #4a5568;">⬅️ Kembali ke Dashboard</button>
                <h3 id="workspace-title" style="margin:0; color:#1a73e8; font-size: 1.2rem;">Materi Belajar</h3>
            </div>
            <div id="workspace-content"></div>
        </div>
    `;

    // --- FIX UTAMA: Perbaikan Navigasi Klik 4 Fitur Utama ---
    const mainFeatureCards = container.querySelectorAll('.main-feature-card');
    mainFeatureCards.forEach(card => {
        card.addEventListener('click', () => {
            const pageTarget = card.getAttribute('data-targetpage');
            if (typeof changePageCallback === 'function') {
                changePageCallback(pageTarget); // Pindah halaman dengan aman!
            }
        });
    });

    // Papan Kontrol Tampilan Layar Penuh
    const mainDashboard = container.querySelector('#home-main-dashboard');
    const focusWorkspace = container.querySelector('#home-focus-workspace');
    const workspaceContent = container.querySelector('#workspace-content');
    const workspaceTitle = container.querySelector('#workspace-title');
    
    container.querySelector('#btn-back-to-dash').onclick = () => {
        focusWorkspace.style.display = 'none';
        mainDashboard.style.display = 'block';
    };

    // --- KELAS LAYAR PENUH: DAILY VOCABULARY ---
    container.querySelector('#go-vocab').onclick = async () => {
        mainDashboard.style.display = 'none';
        focusWorkspace.style.display = 'block';
        workspaceTitle.innerText = "📚 Kelas Fokus: Daily Vocabulary";
        workspaceContent.innerHTML = `<div style="text-align:center; padding:50px; font-size:1.1rem; color:#1a73e8;">⏳ AI sedang merumuskan 10 kosakata Oxford baru...</div>`;

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'vocab'}) });
            let text = await res.text();
            
            // Pembersihan string berlapis agar parsing kebal kegagalan
            text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ');
            const data = JSON.parse(text);

            let html = `
                <div style="background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: left;">
                    <h3 style="color:#0d47a1; margin-top:0; font-size:1.3rem; border-bottom:2px solid #e8f0fe; padding-bottom:10px;">📋 10 Kosakata Baru Hari Ini</h3>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 25px;">
                        ${data.words.map((w, i) => `
                            <div style="background:#f8f9fa; padding:12px; border-radius:8px; border-top:3px solid #1a73e8;">
                                <strong style="font-size:1rem; color:#1a73e8;">${i+1}. ${w.word}</strong><br>
                                <span style="font-size:0.88rem; color:#202124;">Arti: ${w.meaning}</span><br>
                                <small style="color:#5f6368; font-style:italic; display:block; margin-top:4px;">Ex: ${w.example}</small>
                            </div>
                        `).join('')}
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    ${renderWorkspaceQuiz(data.quiz)}
                </div>
            `;
            workspaceContent.innerHTML = html;
            bindWorkspaceQuizEvents(data.quiz, 'vocab');
        } catch (e) {
            workspaceContent.innerHTML = `<p style="color:red; text-align:center;">⚠️ AI sedang padat. Silakan klik tombol kembali di atas dan buka ulang menu ini.</p>`;
        }
    };

    // --- KELAS LAYAR PENUH: GRAMMAR BOOSTER ---
    container.querySelector('#go-grammar').onclick = async () => {
        mainDashboard.style.display = 'none';
        focusWorkspace.style.display = 'block';
        workspaceTitle.innerText = "⚙️ Kelas Fokus: Grammar Booster";
        workspaceContent.innerHTML = `<div style="text-align:center; padding:50px; font-size:1.1rem; color:#1b5e20;">⏳ AI sedang memformulasikan pola kalimat baru harian...</div>`;

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'grammar'}) });
            let text = await res.text();
            text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ');
            const data = JSON.parse(text);

            let html = `
                <div style="background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: left;">
                    <div style="background: linear-gradient(135deg, #e6f4ea 0%, #ffffff 100%); padding: 15px; border-radius: 12px; border-left: 6px solid #34a853; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 5px 0; color: #137333; font-size:1.3rem;">Topik: ${data.topic}</h3>
                        <p style="margin: 0; font-size: 0.95rem; line-height: 1.5; color:#202124;">${data.explanation}</p>
                    </div>
                    <div style="background: #f1f3f4; padding: 12px; border-radius: 8px; margin-bottom: 25px;">
                        <strong style="color:#5f6368; font-size:0.8rem; display:block; margin-bottom:4px;">RUMUS & CONTOH PENGGUNAAN:</strong>
                        <code style="font-size: 1rem; color: #b06000; font-weight: bold; display: block; font-family: monospace;">${data.formula}</code>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    ${renderWorkspaceQuiz(data.quiz)}
                </div>
            `;
            workspaceContent.innerHTML = html;
            bindWorkspaceQuizEvents(data.quiz, 'grammar');
        } catch (e) {
            workspaceContent.innerHTML = `<p style="color:red; text-align:center;">⚠️ AI sedang sibuk memproses. Silakan klik tombol kembali di atas dan buka ulang menu.</p>`;
        }
    };

    function renderWorkspaceQuiz(quiz) {
        return `
            <div style="margin-top:15px;">
                <h4 style="color:#1a73e8; font-size:1.1rem; margin:0 0 10px 0;">🎯 Uji Pemahaman Kompetensi:</h4>
                <p style="font-size:1rem; margin-bottom:12px; font-weight:600; color:#202124;">${quiz.question}</p>
                <div style="display:grid; grid-template-columns: 1fr; gap:8px; max-width:600px;">
                    ${quiz.options.map(o => `<button class="workspace-opt-btn" data-val="${o}" style="text-align:left; padding:10px 15px; border:1px solid #dadce0; background:white; border-radius:8px; font-size:0.95rem; cursor:pointer; transition:all 0.15s;">${o}</button>`).join('')}
                </div>
                <div id="workspace-quiz-expl" style="margin-top:15px; max-width:600px;"></div>
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
                    explDiv.innerHTML = `<div style="padding:12px; background:#f4faf6; border-left:5px solid #34a853; border-radius:8px; font-size:0.9rem;"><strong>🎉 Jawaban Tepat!</strong><br>${quiz.explanation}</div>`;
                } else {
                    window.globalScores[scoreKey] = 0;
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    e.target.style.color = '#c5221f';
                    explDiv.innerHTML = `<div style="padding:12px; background:#fdf5f5; border-left:5px solid #ea4335; border-radius:8px; font-size:0.9rem;"><strong>❌ Kurang Tepat.</strong> Jawaban Benar: <strong>${quiz.answer}</strong><br>${quiz.explanation}</div>`;
                }
            };
        });
    }

    // --- LOGIKA EVALUASI TOTAL & SUBMIT KE DASHBOARD SPREADSHEET B6 ---
    container.querySelector('#btn-submit-all-sessions').onclick = async (e) => {
        const btn = e.target;
        const scores = window.globalScores;
        const finalCalculatedScore = Math.round((scores.speaking + scores.listening + scores.reading + scores.grammar) / 4);

        if (!confirm(`Konfirmasi Selesai Ujian?\n\nRangkuman Nilai Sesi Anda:\n- Speaking: ${scores.speaking}\n- Listening: ${scores.listening}\n- Reading: ${scores.reading}\n- Grammar: ${scores.grammar}\n\nRata-rata Nilai Akhir: ${finalCalculatedScore}\n\nNilai otomatis dikirim ke Spreadsheet tab DASHBOARD!B6.`)) {
            return;
        }

        btn.disabled = true;
        btn.innerText = "⏳ Mengirim Nilai ke Sheet...";

        try {
            const res = await fetch('/api/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finalScore: finalCalculatedScore })
            });
            const result = await res.json();

            if (result.success) {
                alert(`🚀 Sukses! Nilai total (${finalCalculatedScore}) berhasil tersimpan permanen di Google Sheet (Sel B6).`);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            alert(`⚠️ Gangguan Pengiriman: ${err.message}`);
        } finally {
            btn.disabled = false;
            btn.innerText = "Saya Selesai Ujian Hari Ini 🚀";
        }
    };
}
