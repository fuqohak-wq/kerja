// Inisialisasi Score Holder Global jika belum ada di aplikasi
if (!window.globalScores) {
    window.globalScores = { speaking: 100, listening: 0, reading: 0, grammar: 0 };
}

export function renderHome(container, changePageCallback) {
    container.innerHTML = `
        <div class="welcome-section" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 20px; border-radius: 16px; margin-bottom: 15px; text-align:center; box-shadow: 0 4px 15px rgba(26,115,232,0.15);">
            <h2 style="margin:0; font-size:1.8rem; font-weight:800;">Inggris<span style="color:#ffeb3b;">ku</span> Academy</h2>
            <p style="margin:5px 0 0 0; font-size:0.9rem; color:#ffeb3b; font-weight:bold;">Pusat Pelatihan Mandiri AI. Semua modul muat satu layar!</p>
        </div>

        <div class="menu-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 800px; margin: 0 auto; padding: 5px; box-sizing: border-box;">
            
            <div class="menu-card" data-page="speaking" style="background:#fff; border:1px solid #dadce0; border-left:5px solid #1a73e8; padding:15px; border-radius:12px; cursor:pointer; text-align:center; transition: transform 0.2s;">
                <div style="font-size:2rem; margin-bottom:5px;">🎤</div>
                <h4 style="margin:0; font-size:1rem; color:#1a73e8;">Speaking Tutor</h4>
                <p style="color:var(--text-muted); font-size:0.75rem; margin:3px 0 0 0;">Obrolan suara AI</p>
            </div>

            <div class="menu-card" data-page="listening" style="background:#fff; border:1px solid #dadce0; border-left:5px solid #e91e63; padding:15px; border-radius:12px; cursor:pointer; text-align:center; transition: transform 0.2s;">
                <div style="font-size:2rem; margin-bottom:5px;">🎧</div>
                <h4 style="margin:0; font-size:1rem; color:#e91e63;">Listening Practice</h4>
                <p style="color:var(--text-muted); font-size:0.75rem; margin:3px 0 0 0;">Kuis audio 10 ronde</p>
            </div>

            <div class="menu-card" data-page="reading" style="background:#fff; border:1px solid #dadce0; border-left:5px solid #ff9800; padding:15px; border-radius:12px; cursor:pointer; text-align:center; transition: transform 0.2s;">
                <div style="font-size:2rem; margin-bottom:5px;">📖</div>
                <h4 style="margin:0; font-size:1rem; color:#ff9800;">Reading Academy</h4>
                <p style="color:var(--text-muted); font-size:0.75rem; margin:3px 0 0 0;">Ketuk & terjemahkan</p>
            </div>

            <div class="menu-card" data-page="writing" style="background:#fff; border:1px solid #dadce0; border-left:5px solid #9c27b0; padding:15px; border-radius:12px; cursor:pointer; text-align:center; transition: transform 0.2s;">
                <div style="font-size:2rem; margin-bottom:5px;">✍️</div>
                <h4 style="margin:0; font-size:1rem; color:#9c27b0;">Writing Corrector</h4>
                <p style="color:var(--text-muted); font-size:0.75rem; margin:3px 0 0 0;">Koreksi esai AI</p>
            </div>

            <div class="menu-card dynamic-card" id="card-vocab" style="background: linear-gradient(135deg, #e8f0fe 0%, #ffffff 100%); border:1px solid #b4cffc; padding:15px; border-radius:12px; cursor:pointer; text-align:center; transition: transform 0.2s;">
                <div style="font-size:2rem; margin-bottom:5px;">📚</div>
                <h4 style="margin:0; color:#185abc; font-size:1rem;">Daily Vocab</h4>
                <p style="color:#5f6368; font-size:0.75rem; margin:3px 0 0 0;">10 Kata Baru & Kuis</p>
            </div>

            <div class="menu-card dynamic-card" id="card-grammar" style="background: linear-gradient(135deg, #e6f4ea 0%, #ffffff 100%); border:1px solid #a8dab5; padding:15px; border-radius:12px; cursor:pointer; text-align:center; transition: transform 0.2s;">
                <div style="font-size:2rem; margin-bottom:5px;">⚙️</div>
                <h4 style="margin:0; color:#137333; font-size:1rem;">Grammar Booster</h4>
                <p style="color:#5f6368; font-size:0.75rem; margin:3px 0 0 0;">Pola Kalimat Esensial</p>
            </div>
        </div>

        <div style="max-width: 800px; margin: 15px auto 0 auto; background: #fff; padding: 15px; border-radius: 12px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.04); border: 2px dashed #1a73e8;">
            <h4 style="margin: 0 0 5px 0; color: #1a73e8; font-size: 1rem;">🏁 Evaluasi Akhir Belajar Hari Ini?</h4>
            <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #5f6368;">Hitung rata-rata nilai seluruh sesi Anda hari ini dan simpan otomatis ke Google Sheets.</p>
            <button id="btn-submit-all-sessions" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; border: none; padding: 10px 25px; border-radius: 25px; font-size: 0.9rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(26,115,232,0.3);">Saya Selesai Ujian Hari Ini 🚀</button>
        </div>

        <div id="daily-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; justify-content:center; align-items:center; padding:15px; box-sizing:border-box;">
            <div id="modal-content" style="background:#fff; width:100%; max-width:500px; max-height:80vh; overflow-y:auto; padding:20px; border-radius:16px; position:relative;">
                <button id="close-modal-btn" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:1.8rem; cursor:pointer; color:#5f6368;">&times;</button>
                <div id="modal-body-data" style="padding-top:10px;"></div>
            </div>
        </div>
    `;

    // --- PERBAIKAN NAVIGASI UTAMA ---
    // Gunakan selector atribut [data-page] secara langsung agar Router Aplikasi Anda menangkap aksi klik dengan sempurna!
    const cards = container.querySelectorAll('[data-page]');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const pageName = card.getAttribute('data-page');
            if (typeof changePageCallback === 'function') {
                changePageCallback(pageName);
            }
        });
        card.addEventListener('mouseover', () => card.style.transform = 'translateY(-2px)');
        card.addEventListener('mouseout', () => card.style.transform = 'translateY(0)');
    });

    // Hubungkan efek hover kartu dinamis
    const dynamicCards = container.querySelectorAll('.dynamic-card');
    dynamicCards.forEach(c => {
        c.addEventListener('mouseover', () => c.style.transform = 'translateY(-2px)');
        c.addEventListener('mouseout', () => c.style.transform = 'translateY(0)');
    });

    const dailyModal = container.querySelector('#daily-modal');
    const modalBody = container.querySelector('#modal-body-data');
    container.querySelector('#close-modal-btn').onclick = () => dailyModal.style.display = 'none';

    // Aksi Klik Daily Vocab
    container.querySelector('#card-vocab').onclick = async () => {
        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Meracik 10 kata baru bebas eror...</div>`;
        dailyModal.style.display = 'flex';

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'vocab'}) });
            let text = await res.text();
            text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' '); // Bersihkan escape enter
            const data = JSON.parse(text);
            
            let html = `<h3 style="margin-top:0;">📚 10 Kosakata Hari Ini</h3><ol style="padding-left:20px; text-align:left; font-size:0.95rem; line-height:1.5;">`;
            data.words.forEach(w => {
                html += `<li style="margin-bottom:8px;"><strong>${w.word}</strong>: ${w.meaning}<br><small style="color:gray;">Ex: <em>${w.example}</em></small></li>`;
            });
            html += `</ol><hr style="border:0; border-top:1px solid #ddd; margin:15px 0;">` + renderMiniQuiz(data.quiz);
            
            modalBody.innerHTML = html;
            bindQuizEvents(data.quiz, 'vocab');
        } catch (e) {
            modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ Gagal memuat materi. Hubungan AI sibuk. Silakan coba klik kembali!</p>`;
        }
    };

    // Aksi Klik Grammar Booster
    container.querySelector('#card-grammar').onclick = async () => {
        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Menghubungi AI untuk rumus kalimat baru...</div>`;
        dailyModal.style.display = 'flex';

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'grammar'}) });
            let text = await res.text();
            text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ');
            const data = JSON.parse(text);
            
            let html = `
                <h3 style="margin-top:0; color:#137333;">⚙️ Grammar Booster</h3>
                <div style="background:#f4faf6; padding:12px; border-radius:8px; font-size:0.95rem; text-align:left; border-left:4px solid #34a853; margin-bottom:12px;">
                    <strong>${data.topic}</strong><br>${data.explanation}
                </div>
                <p style="text-align:left; font-size:0.9rem;"><strong>Pola/Contoh:</strong> <code style="background:#eee; padding:2px 6px; border-radius:4px; display:block; margin-top:3px;">${data.formula}</code></p>
                <hr style="border:0; border-top:1px solid #ddd; margin:15px 0;">
            ` + renderMiniQuiz(data.quiz);
            
            modalBody.innerHTML = html;
            bindQuizEvents(data.quiz, 'grammar');
        } catch (e) {
            modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ Gagal memuat materi. Hubungan AI sibuk. Silakan coba klik kembali!</p>`;
        }
    };

    function renderMiniQuiz(quiz) {
        return `
            <div style="text-align:left; font-size:0.95rem;">
                <h4 style="margin:0 0 8px 0; color:#1a73e8;">🎯 Uji Pemahaman:</h4>
                <p style="margin:0 0 10px 0; font-weight:bold;">${quiz.question}</p>
                <div style="display:flex; flex-direction:column; gap:6px;">
                    ${quiz.options.map(o => `<button class="option-btn daily-opt-btn" data-val="${o}" style="text-align:left; padding:8px 12px; width:100%; font-size:0.9rem; border: 1px solid #dadce0; background: #fff; border-radius: 6px; cursor: pointer;">${o}</button>`).join('')}
                </div>
                <div id="daily-quiz-expl" style="margin-top:12px;"></div>
            </div>
        `;
    }

    // --- PENYIMPANAN NILAI KUIS DARI POP-UP MODAL ---
    function bindQuizEvents(quiz, scoreKey) {
        const btns = modalBody.querySelectorAll('.daily-opt-btn');
        const explDiv = modalBody.querySelector('#daily-quiz-expl');
        
        btns.forEach(btn => {
            btn.onclick = (e) => {
                const selected = e.target.getAttribute('data-val');
                btns.forEach(b => b.disabled = true);
                
                if (selected === quiz.answer) {
                    window.globalScores[scoreKey] = 100;
                    e.target.style.background = '#e6f4ea';
                    e.target.style.borderColor = '#34a853';
                    explDiv.innerHTML = `<div style="padding:10px; background:#f4faf6; border-left:4px solid #34a853; font-size:0.85rem; border-radius:4px;"><strong>🎉 Benar!</strong><br>${quiz.explanation}</div>`;
                } else {
                    window.globalScores[scoreKey] = 0;
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    explDiv.innerHTML = `<div style="padding:10px; background:#fdf5f5; border-left:4px solid #ea4335; font-size:0.85rem; border-radius:4px;"><strong>❌ Kurang Tepat.</strong> Jawaban: <strong>${quiz.answer}</strong><br>${quiz.explanation}</div>`;
                }
            };
        });
    }

    // --- HUBUNGKAN LOGIKA TOMBOL SUBMIT GOOGLE SHEET (DASHBOARD!B6) ---
    container.querySelector('#btn-submit-all-sessions').onclick = async (e) => {
        const btn = e.target;
        const scores = window.globalScores;
        const finalCalculatedScore = Math.round((scores.speaking + scores.listening + scores.reading + scores.grammar) / 4);

        if (!confirm(`Konfirmasi Selesai Ujian?\n\nRangkuman Nilai:\n- Speaking: ${scores.speaking}\n- Listening: ${scores.listening}\n- Reading: ${scores.reading}\n- Grammar: ${scores.grammar}\n\nRata-rata Nilai: ${finalCalculatedScore}\n\nNilai akan langsung dikirim ke spreadsheet tab DASHBOARD kolom B6.`)) {
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
            
            // Mengatasi error 'Unexpected token A' jika Vercel mengembalikan text/html saat crash
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Kredensial Google Sheet (Environment Variables) Anda di Vercel belum dikonfigurasi.");
            }

            const result = await res.json();
            if (result.success) {
                alert(`🚀 Sukses! Nilai akumulasi hari ini (${finalCalculatedScore}) berhasil masuk ke Spreadsheet Tab DASHBOARD kolom B6.`);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            alert(`⚠️ Gagal Mengirim Nilai!\n\nDetail Error: ${err.message}`);
        } finally {
            btn.disabled = false;
            btn.innerText = "Saya Selesai Ujian Hari Ini 🚀";
        }
    };
}
