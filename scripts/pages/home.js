// Inisialisasi Score Holder Global jika belum ada
if (!window.globalScores) {
    window.globalScores = { speaking: 100, listening: 0, reading: 0, grammar: 0 };
}

export function renderHome(container, changePageCallback) {
    // Inject Style Warna Cerah & Animasi agar tidak terkesan hitam putih
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
                transform: translateY(-5px) !important;
                box-shadow: 0 8px 25px rgba(26, 115, 232, 0.25) !important;
            }
            .full-screen-container {
                background: #f0f4f9;
                min-height: 85vh;
                padding: 20px;
                border-radius: 20px;
                animation: fadeIn 0.3s ease-in-out;
            }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `;
        document.head.appendChild(styleEl);
    }

    container.innerHTML = `
        <div id="home-main-dashboard">
            <!-- Header Cerah Gradasi Biru -->
            <div class="welcome-section" style="background: var(--primary-gradient); color: white; padding: 25px; border-radius: 16px; margin-bottom: 20px; text-align: center; box-shadow: var(--card-shadow);">
                <h2 style="margin: 0; font-size: 2.2rem; font-weight: 800; letter-spacing: 0.5px;">Inggris<span style="color: #ffeb3b;">ku</span> Academy</h2>
                <p style="margin: 8px 0 0 0; font-size: 1rem; opacity: 0.9;">Tingkatkan Kompetensi Bahasa Inggrismu Bersama AI Personal Coach</p>
            </div>

            <!-- Grid Menu Utama Penuh Warna -->
            <div class="menu-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; max-width: 850px; margin: 0 auto 25px auto; padding: 5px;">
                
                <div class="menu-card" data-page="speaking" style="background: #ffffff; padding: 20px; border-radius: 16px; cursor: pointer; text-align: center; border-left: 5px solid #1a73e8 !important;">
                    <div style="font-size: 2.5rem; margin-bottom: 5px;">🎤</div>
                    <h4 style="margin: 0; font-size: 1.1rem; color: #1a73e8;">Speaking Tutor</h4>
                    <p style="color: #5f6368; font-size: 0.8rem; margin-top: 4px;">Praktek Percakapan Suara</p>
                </div>

                <div class="menu-card" data-page="listening" style="background: #ffffff; padding: 20px; border-radius: 16px; cursor: pointer; text-align: center; border-left: 5px solid #e91e63 !important;">
                    <div style="font-size: 2.5rem; margin-bottom: 5px;">🎧</div>
                    <h4 style="margin: 0; font-size: 1.1rem; color: #e91e63;">Listening Practice</h4>
                    <p style="color: #5f6368; font-size: 0.8rem; margin-top: 4px;">Kuis Pemahaman Audio AI</p>
                </div>

                <div class="menu-card" data-page="reading" style="background: #ffffff; padding: 20px; border-radius: 16px; cursor: pointer; text-align: center; border-left: 5px solid #ff9800 !important;">
                    <div style="font-size: 2.5rem; margin-bottom: 5px;">📖</div>
                    <h4 style="margin: 0; font-size: 1.1rem; color: #ff9800;">Reading Academy</h4>
                    <p style="color: #5f6368; font-size: 0.8rem; margin-top: 4px;">Klik & Terjemah Instan</p>
                </div>

                <div class="menu-card" data-page="writing" style="background: #ffffff; padding: 20px; border-radius: 16px; cursor: pointer; text-align: center; border-left: 5px solid #9c27b0 !important;">
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

            <!-- Panel Konfirmasi & Evaluasi Akhir Sesi Hari Ini -->
            <div style="max-width: 850px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 16px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.04); border: 2px dashed #1a73e8;">
                <h4 style="margin: 0 0 8px 0; color: #1a73e8; font-size: 1.2rem;">🏁 Evaluasi Akhir Belajar Hari Ini?</h4>
                <p style="margin: 0 0 15px 0; font-size: 0.88rem; color: #5f6368;">Jika Anda sudah menyelesaikan seluruh rangkaian tantangan, klik tombol di bawah untuk mengalkulasi nilai total dan mengirim data otomatis ke Google Sheet.</p>
                <button id="btn-submit-all-sessions" style="background: var(--primary-gradient); color: white; border: none; padding: 12px 30px; border-radius: 25px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: opacity 0.2s; box-shadow: 0 4px 10px rgba(26,115,232,0.3);">Saya Selesai Ujian Hari Ini 🚀</button>
            </div>
        </div>

        <!-- Container Belajar Layar Penuh Fokus -->
        <div id="home-focus-workspace" class="full-screen-container" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #dcdcdc;">
                <button id="btn-back-to-dash" style="background: #e0e0e0; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; color: #424242;">⬅️ Kembali ke Menu Utama</button>
                <h3 id="workspace-title" style="margin:0; color:#1a73e8;">Materi Belajar</h3>
            </div>
            <div id="workspace-content"></div>
        </div>
    `;

    // Routing Tombol Halaman Standar
    const cards = container.querySelectorAll('.menu-card:not(.dynamic-action-card)');
    cards.forEach(card => {
        card.addEventListener('click', () => changePageCallback(card.getAttribute('data-page')));
    });

    const mainDashboard = container.querySelector('#home-main-dashboard');
    const focusWorkspace = container.querySelector('#home-focus-workspace');
    const workspaceContent = container.querySelector('#workspace-content');
    const workspaceTitle = container.querySelector('#workspace-title');
    
    container.querySelector('#btn-back-to-dash').onclick = () => {
        focusWorkspace.style.display = 'none';
        mainDashboard.style.display = 'block';
    };

    // --- MODUL LAYAR PENUH: DAILY VOCABULARY ---
    container.querySelector('#go-vocab').onclick = async () => {
        mainDashboard.style.display = 'none';
        focusWorkspace.style.display = 'block';
        workspaceTitle.innerText = "📚 Kelas Fokus: Daily Vocabulary";
        workspaceContent.innerHTML = `<div style="text-align:center; padding:50px; font-size:1.2rem; color:#1a73e8;">⏳ AI sedang merumuskan 10 kosakata baru pilihan Oxford...</div>`;

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'vocab'}) });
            let text = await res.text();
            text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ');
            const data = JSON.parse(text);

            let html = `
                <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: left;">
                    <h3 style="color:#0d47a1; margin-top:0; font-size:1.5rem; border-bottom:2px solid #e8f0fe; padding-bottom:10px;">📋 10 Kosakata Baru Esensial</h3>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; margin-bottom: 30px;">
                        ${data.words.map((w, i) => `
                            <div style="background:#f8f9fa; padding:12px; border-radius:8px; border-top:3px solid #1a73e8;">
                                <strong style="font-size:1.1rem; color:#1a73e8;">${i+1}. ${w.word}</strong><br>
                                <span style="font-size:0.9rem; color:#202124;">Arti: ${w.meaning}</span><br>
                                <small style="color:#5f6368; font-style:italic; display:block; margin-top:4px;">Ex: ${w.example}</small>
                            </div>
                        `).join('')}
                    </div>
                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 25px 0;">
                    ${renderWorkspaceQuiz(data.quiz)}
                </div>
            `;
            workspaceContent.innerHTML = html;
            bindWorkspaceQuizEvents(data.quiz, 'vocab');
        } catch (e) {
            workspaceContent.innerHTML = `<p style="color:red; text-align:center;">⚠️ Gagal terhubung dengan server AI. Silakan kembali dan klik ulang.</p>`;
        }
    };

    // --- MODUL LAYAR PENUH: GRAMMAR BOOSTER ---
    container.querySelector('#go-grammar').onclick = async () => {
        mainDashboard.style.display = 'none';
        focusWorkspace.style.display = 'block';
        workspaceTitle.innerText = "⚙️ Kelas Fokus: Grammar Booster";
        workspaceContent.innerHTML = `<div style="text-align:center; padding:50px; font-size:1.2rem; color:#1b5e20;">⏳ AI sedang memformulasikan struktur kalimat advance harian...</div>`;

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'grammar'}) });
            let text = await res.text();
            text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ');
            const data = JSON.parse(text);

            let html = `
                <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: left;">
                    <div style="background: linear-gradient(135deg, #e6f4ea 0%, #ffffff 100%); padding: 20px; border-radius: 12px; border-left: 6px solid #34a853; margin-bottom: 25px;">
                        <h3 style="margin: 0 0 8px 0; color: #137333; font-size:1.4rem;">Topik: ${data.topic}</h3>
                        <p style="margin: 0; font-size: 1.05rem; line-height: 1.6; color:#202124;">${data.explanation}</p>
                    </div>
                    <div style="background: #f1f3f4; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
                        <strong style="color:#5f6368; font-size:0.85rem; display:block; margin-bottom:5px;">RUMUS & CONTOH PENGGUNAAN KALIMAT:</strong>
                        <code style="font-size: 1.1rem; color: #b06000; font-weight: bold; display: block; font-family: monospace;">${data.formula}</code>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 25px 0;">
                    ${renderWorkspaceQuiz(data.quiz)}
                </div>
            `;
            workspaceContent.innerHTML = html;
            bindWorkspaceQuizEvents(data.quiz, 'grammar');
        } catch (e) {
            workspaceContent.innerHTML = `<p style="color:red; text-align:center;">⚠️ Terjadi gangguan jaringan AI. Silakan kembali dan muat ulang.</p>`;
        }
    };

    function renderWorkspaceQuiz(quiz) {
        return `
            <div style="margin-top:20px;">
                <h4 style="color:#1a73e8; font-size:1.2rem; margin:0 0 12px 0;">🎯 Uji Kompetensi Pemahaman:</h4>
                <p style="font-size:1.1rem; margin-bottom:15px; font-weight:600; color:#202124;">${quiz.question}</p>
                <div style="display:grid; grid-template-columns: 1fr; gap:10px; max-width:600px;">
                    ${quiz.options.map(o => `<button class="workspace-opt-btn" data-val="${o}" style="text-align:left; padding:12px 18px; border:1px solid #dadce0; background:white; border-radius:8px; font-size:1rem; cursor:pointer; transition:all 0.2s;">${o}</button>`).join('')}
                </div>
                <div id="workspace-quiz-expl" style="margin-top:20px; max-width:600px;"></div>
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
                    window.globalScores[scoreKey] = 100; // Dapat nilai maksimal untuk sesi ini
                    e.target.style.background = '#e6f4ea';
                    e.target.style.borderColor = '#34a853';
                    e.target.style.color = '#137333';
                    explDiv.innerHTML = `<div style="padding:15px; background:#f4faf6; border-left:5px solid #34a853; border-radius:8px; font-size:0.95rem;"><strong>🎉 Luar Biasa, Jawaban Benar!</strong><br>${quiz.explanation}</div>`;
                } else {
                    window.globalScores[scoreKey] = 0; // Nilai 0 jika salah menjawab
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    e.target.style.color = '#c5221f';
                    explDiv.innerHTML = `<div style="padding:15px; background:#fdf5f5; border-left:5px solid #ea4335; border-radius:8px; font-size:0.95rem;"><strong>❌ Kurang Tepat.</strong> Kunci Jawaban: <strong>${quiz.answer}</strong><br>${quiz.explanation}</div>`;
                }
            };
        });
    }

    // --- LOGIKA EVALUASI AKHIR & SUBMIT KE SPREADSHEET (TAB DASHBOARD B6) ---
    container.querySelector('#btn-submit-all-sessions').onclick = async (e) => {
        const btn = e.target;
        
        // Simpan nilai reading dari sesi membaca eksternal jika ada, atau kalkulasi akumulasi default
        const scores = window.globalScores;
        const finalCalculatedScore = Math.round((scores.speaking + scores.listening + scores.reading + scores.grammar) / 4);

        if (!confirm(`Konfirmasi Selesai Ujian?\n\nDetail Nilai Anda:\n- Speaking: ${scores.speaking}\n- Listening: ${scores.listening}\n- Reading: ${scores.reading}\n- Grammar: ${scores.grammar}\n\nRata-rata Nilai: ${finalCalculatedScore}\n\nNilai akan langsung dikirim ke spreadsheet tab DASHBOARD!B6.`)) {
            return;
        }

        btn.disabled = true;
        btn.innerText = "⏳ Memproses & Mengirim Nilai ke Sheet...";

        try {
            const res = await fetch('/api/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finalScore: finalCalculatedScore })
            });
            const result = await res.json();

            if (result.success) {
                alert(`🚀 Sukses! Nilai total (${finalCalculatedScore}) berhasil masuk ke Spreadsheet Tab DASHBOARD di kolom B6.`);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            alert(`⚠️ Gagal mengirim nilai: ${err.message}`);
        } finally {
            btn.disabled = false;
            btn.innerText = "Saya Selesai Ujian Hari Ini 🚀";
        }
    };
}
