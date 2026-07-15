// Inisialisasi Score Holder Global jika belum ada di aplikasi
if (!window.globalScores) {
    window.globalScores = { speaking: 100, listening: 0, reading: 0, grammar: 0 };
}

/**
 * Merender halaman beranda ke dalam kontainer utama
 * @param {HTMLElement} container 
 */
export function renderHome(container) {
    // 1. Tulis HTML Asli Anda + Tambahkan Modul Harian & Tombol Evaluasi B6 di bawahnya
    container.innerHTML = `
        <div class="welcome-section" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 20px; border-radius: 16px; margin-bottom: 15px; text-align:center; box-shadow: 0 4px 15px rgba(26,115,232,0.15);">
            <h2 style="margin:0; color: white !important;">Halo, Pelajar! 👋</h2>
            <p style="margin:5px 0 0 0; color: #ffeb3b !important; font-weight: bold;">Pilih skill yang ingin kamu latih hari ini bersama AI Tutor kamu.</p>
        </div>

        <div class="menu-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 800px; margin: 0 auto; padding: 5px; box-sizing: border-box;">
            
            <div class="menu-card" data-skill="speaking" style="border-left: 5px solid #1a73e8;">
                <span class="menu-icon">🎤</span>
                <span class="menu-title">Speaking</span>
            </div>
            <div class="menu-card" data-skill="listening" style="border-left: 5px solid #e91e63;">
                <span class="menu-icon">🎧</span>
                <span class="menu-title">Listening</span>
            </div>
            <div class="menu-card" data-skill="reading" style="border-left: 5px solid #ff9800;">
                <span class="menu-icon">📖</span>
                <span class="menu-title">Reading</span>
            </div>
            <div class="menu-card" data-skill="writing" style="border-left: 5px solid #9c27b0;">
                <span class="menu-icon">✍️</span>
                <span class="menu-title">Writing</span>
            </div>

            <div class="menu-card dynamic-mod" id="card-vocab" style="background: linear-gradient(135deg, #e8f0fe 0%, #ffffff 100%); border:1px solid #b4cffc; padding: 15px 10px; flex-direction: column; justify-content: center; cursor: pointer;">
                <span class="menu-icon" style="margin-bottom: 5px;">📚</span>
                <span class="menu-title" style="color:#185abc; font-weight:bold;">Daily Vocab</span>
            </div>

            <div class="menu-card dynamic-mod" id="card-grammar" style="background: linear-gradient(135deg, #e6f4ea 0%, #ffffff 100%); border:1px solid #a8dab5; padding: 15px 10px; flex-direction: column; justify-content: center; cursor: pointer;">
                <span class="menu-icon" style="margin-bottom: 5px;">⚙️</span>
                <span class="menu-title" style="color:#137333; font-weight:bold;">Grammar</span>
            </div>
        </div>

        <div style="max-width: 800px; margin: 15px auto 0 auto; background: #fff; padding: 15px; border-radius: 12px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.04); border: 2px dashed #1a73e8;">
            <h4 style="margin: 0 0 5px 0; color: #1a73e8; font-size: 1rem;">🏁 Evaluasi Akhir Belajar Hari Ini?</h4>
            <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #5f6368;">Hitung akumulasi seluruh nilai Anda dan kirim datanya langsung ke Google Sheet B6.</p>
            <button id="btn-submit-all-sessions" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; border: none; padding: 10px 25px; border-radius: 25px; font-size: 0.9rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(26,115,232,0.3);">Saya Selesai Ujian Hari Ini 🚀</button>
        </div>

        <div id="daily-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; justify-content:center; align-items:center; padding:15px; box-sizing:border-box;">
            <div id="modal-content" style="background:#fff; width:100%; max-width:500px; max-height:80vh; overflow-y:auto; padding:20px; border-radius:16px; position:relative;">
                <button id="close-modal-btn" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:1.8rem; cursor:pointer; color:#5f6368; line-height:1;">&times;</button>
                <div id="modal-body-data" style="padding-top:10px;"></div>
            </div>
        </div>
    `;

    // --- SETUP ELEMENT POPUP ---
    const dailyModal = container.querySelector('#daily-modal');
    const modalBody = container.querySelector('#modal-body-data');
    container.querySelector('#close-modal-btn').onclick = () => dailyModal.style.display = 'none';

    // --- AKSI KLIK: DAILY VOCAB ---
    container.querySelector('#card-vocab').onclick = async (e) => {
        e.stopPropagation(); // Mencegah bentrok gelembung klik ke router
        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Meracik 10 kata baru dari AI...</div>`;
        dailyModal.style.display = 'flex';

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'vocab'}) });
            const data = await res.json();
            
            let html = `<h3 style="margin-top:0;">📚 10 Kosakata Hari Ini</h3><ol style="padding-left:20px; text-align:left; font-size:0.95rem; line-height:1.5;">`;
            data.words.forEach(w => {
                html += `<li style="margin-bottom:8px;"><strong>${w.word}</strong>: ${w.meaning}<br><small style="color:gray;">Ex: <em>${w.example}</em></small></li>`;
            });
            html += `</ol><hr style="border:0; border-top:1px solid #ddd; margin:15px 0;">` + renderMiniQuiz(data.quiz);
            
            modalBody.innerHTML = html;
            bindQuizEvents(data.quiz, 'vocab');
        } catch (e) {
            modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ Hubungan AI sibuk. Silakan tutup dan klik kembali!</p>`;
        }
    };

    // --- AKSI KLIK: GRAMMAR BOOSTER ---
    container.querySelector('#card-grammar').onclick = async (e) => {
        e.stopPropagation();
        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Menghubungi AI untuk rumus kalimat baru...</div>`;
        dailyModal.style.display = 'flex';

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'grammar'}) });
            const data = await res.json();
            
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
            modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ Hubungan AI sibuk. Silakan tutup dan klik kembali!</p>`;
        }
    };

    function renderMiniQuiz(quiz) {
        return `
            <div style="text-align:left; font-size:0.95rem;">
                <h4 style="margin:0 0 8px 0; color:#1a73e8;">🎯 Uji Pemahaman:</h4>
                <p style="margin:0 0 10px 0; font-weight:bold;">${quiz.question}</p>
                <div style="display:flex; flex-direction:column; gap:6px;">
                    ${quiz.options.map(o => `<button class="daily-opt-btn" data-val="${o}" style="text-align:left; padding:8px 12px; width:100%; font-size:0.9rem; border:1px solid #dadce0; background:#fff; border-radius:6px; cursor:pointer;">${o}</button>`).join('')}
                </div>
                <div id="daily-quiz-expl" style="margin-top:12px;"></div>
            </div>
        `;
    }

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

    // --- LOGIKA TOMBOL SUBMIT GOOGLE SHEET (DASHBOARD!B6) ---
    container.querySelector('#btn-submit-all-sessions').onclick = async (e) => {
        const btn = e.target;
        const scores = window.globalScores;
        const finalCalculatedScore = Math.round((scores.speaking + scores.listening + scores.reading + scores.grammar) / 4);

        if (!confirm(`Konfirmasi Selesai Ujian?\n\nRangkuman Nilai Anda:\n- Speaking: ${scores.speaking}\n- Listening: ${scores.listening}\n- Reading: ${scores.reading}\n- Grammar: ${scores.grammar}\n\nRata-rata Nilai: ${finalCalculatedScore}\n\nNilai akan dikirim ke Spreadsheet tab DASHBOARD kolom B6.`)) {
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
                alert(`🚀 Sukses! Nilai total (${finalCalculatedScore}) berhasil masuk ke Google Sheet B6.`);
            } else {
                throw new Error(result.error || 'Gagal menyimpan.');
            }
        } catch (err) {
            alert(`⚠️ Gagal Mengirim Nilai!\nDetail: ${err.message}`);
        } finally {
            btn.disabled = false;
            btn.innerText = "Saya Selesai Ujian Hari Ini 🚀";
        }
    };
}
