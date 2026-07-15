// Inisialisasi Score Holder Global jika belum ada di aplikasi
if (!window.globalScores) {
    window.globalScores = { speaking: 100, listening: 0, reading: 0, grammar: 0 };
}

/**
 * Merender halaman beranda ke dalam kontainer utama
 * @param {HTMLElement} container 
 */
export function renderHome(container) {
    // 1. Tulis HTML Asli Anda + Struktur Modul Harian & Tombol Evaluasi B6
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
            <div id="modal-content" style="background:#fff; width:100%; max-width:500px; max-height:85vh; overflow-y:auto; padding:20px; border-radius:16px; position:relative; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                <button id="close-modal-btn" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:1.8rem; cursor:pointer; color:#5f6368; line-height:1;">&times;</button>
                <div id="modal-body-data" style="padding-top:10px;"></div>
            </div>
        </div>
    `;

    // Ambil Referensi Modal DOM yang valid di dalam kontainer beranda
    const dailyModal = container.querySelector('#daily-modal');
    const modalBody = container.querySelector('#modal-body-data');
    const closeModalBtn = container.querySelector('#close-modal-btn');

    // Pengaturan Tombol Tutup Modal
    if (closeModalBtn && dailyModal) {
        closeModalBtn.onclick = () => { dailyModal.style.display = 'none'; };
    }

    // KELOLA KLIK DAILY VOCAB
    container.querySelector('#card-vocab').onclick = async (e) => {
        e.stopPropagation();
        if (!dailyModal || !modalBody) return;

        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ AI sedang meracik tema & 10 kata baru...</div>`;
        dailyModal.style.display = 'flex';

        try {
            // 1. Ambil Materi Utama dari AI
            const matRes = await fetch('/api/daily', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'get-material', type: 'vocab' })
            });
            const material = await matRes.json();
            
            let html = `<h3 style="margin-top:0; color:#1a73e8;">📚 Tema: ${material.theme}</h3><ol style="padding-left:20px; text-align:left; font-size:0.95rem; line-height:1.5;">`;
            material.words.forEach(w => {
                html += `<li style="margin-bottom:8px;"><strong>${w.word}</strong>: ${w.meaning}<br><small style="color:gray;">Ex: <em>${w.example}</em></small></li>`;
            });
            html += `</ol><hr style="border:0; border-top:1px solid #ddd; margin:15px 0;"><div id="quiz-loading-area" style="text-align:center; color:gray; font-size:0.9rem;">⏳ AI sedang membuat 5 soal latihan untuk tema ini...</div>`;
            modalBody.innerHTML = html;

            // 2. Ambil Paket 5 Soal Latihan secara terpisah
            const quizRes = await fetch('/api/daily', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'get-quizzes', currentMaterial: material })
            });
            const quizData = await quizRes.json();
            
            const loadingArea = modalBody.querySelector('#quiz-loading-area');
            if (loadingArea) {
                loadingArea.outerHTML = `<div id="quiz-container-area"></div>`;
                renderMiniQuizSystem(quizData.quizzes, 'vocab', modalBody.querySelector('#quiz-container-area'));
            }

        } catch (err) {
            console.error(err);
            modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ AI sedang padat. Tutup modal dan klik ulang untuk mencoba topik baru.</p>`;
        }
    };

    // KELOLA KLIK GRAMMAR BOOSTER
    container.querySelector('#card-grammar').onclick = async (e) => {
        e.stopPropagation();
        if (!dailyModal || !modalBody) return;

        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ AI sedang merumuskan topik grammar baru...</div>`;
        dailyModal.style.display = 'flex';

        try {
            // 1. Ambil Materi Utama dari AI
            const matRes = await fetch('/api/daily', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'get-material', type: 'grammar' })
            });
            const material = await matRes.json();
            
            let html = `
                <h3 style="margin-top:0; color:#137333;">⚙️ ${material.topic}</h3>
                <div style="background:#f4faf6; padding:12px; border-radius:8px; font-size:0.95rem; text-align:left; border-left:4px solid #34a853; margin-bottom:12px; color:#137333;">
                    ${material.explanation}
                </div>
                <p style="text-align:left; font-size:0.9rem;"><strong>Pola/Contoh:</strong> <code style="background:#eee; padding:4px 8px; border-radius:4px; display:block; margin-top:3px;">${material.formula}</code></p>
                <hr style="border:0; border-top:1px solid #ddd; margin:15px 0;">
                <div id="quiz-loading-area" style="text-align:center; color:gray; font-size:0.9rem;">⏳ AI sedang membuat 5 soal latihan untuk topik ini...</div>
            `;
            modalBody.innerHTML = html;

            // 2. Ambil Paket 5 Soal Latihan secara terpisah
            const quizRes = await fetch('/api/daily', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'get-quizzes', currentMaterial: material })
            });
            const quizData = await quizRes.json();
            
            const loadingArea = modalBody.querySelector('#quiz-loading-area');
            if (loadingArea) {
                loadingArea.outerHTML = `<div id="quiz-container-area"></div>`;
                renderMiniQuizSystem(quizData.quizzes, 'grammar', modalBody.querySelector('#quiz-container-area'));
            }

        } catch (err) {
            console.error(err);
            modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ AI sedang padat. Tutup modal dan klik ulang untuk mencoba topik baru.</p>`;
        }
    };

    // --- ENGINE MULTI-SOAL KUIS (MENANGANI 5 SOAL BERURUTAN) ---
    function renderMiniQuizSystem(quizzes, scoreKey, targetContainer) {
        let currentQuestionIndex = 0;
        let correctAnswersCount = 0;

        function displayQuestion() {
            const currentQuiz = quizzes[currentQuestionIndex];
            targetContainer.innerHTML = `
                <div style="text-align:left; font-size:0.95rem; background:#fafafa; padding:15px; border-radius:10px; border:1px solid #eaeaea; margin-top:10px;">
                    <div style="display:flex; justify-content:between; font-size:0.8rem; color:gray; margin-bottom:5px; font-weight:bold;">
                        <span>🎯 Uji Pemahaman (${currentQuestionIndex + 1} dari 5)</span>
                    </div>
                    <p style="margin:0 0 12px 0; font-weight:bold; line-height:1.4;">${currentQuiz.question}</p>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${currentQuiz.options.map(o => `<button class="daily-opt-btn" data-val="${o}" style="text-align:left; padding:10px 14px; width:100%; font-size:0.9rem; border:1px solid #dadce0; background:#fff; border-radius:8px; cursor:pointer; transition:all 0.2s;">${o}</button>`).join('')}
                    </div>
                    <div id="daily-quiz-expl" style="margin-top:12px;"></div>
                    <button id="next-quiz-btn" style="display:none; margin-top:15px; background:#1a73e8; color:white; border:none; padding:8px 20px; border-radius:6px; cursor:pointer; font-weight:bold; float:right;">Lanjut ➡️</button>
                    <div style="clear:both;"></div>
                </div>
            `;

            const optButtons = targetContainer.querySelectorAll('.daily-opt-btn');
            const explDiv = targetContainer.querySelector('#daily-quiz-expl');
            const nextBtn = targetContainer.querySelector('#next-quiz-btn');

            optButtons.forEach(btn => {
                btn.onclick = (e) => {
                    const selected = e.target.getAttribute('data-val');
                    optButtons.forEach(b => b.disabled = true);

                    if (selected === currentQuiz.answer) {
                        correctAnswersCount++;
                        e.target.style.background = '#e6f4ea';
                        e.target.style.borderColor = '#34a853';
                        e.target.style.color = '#137333';
                        explDiv.innerHTML = `<div style="padding:10px; background:#f4faf6; border-left:4px solid #34a853; font-size:0.85rem; border-radius:4px; color:#137333;"><strong>🎉 Benar!</strong><br>${currentQuiz.explanation}</div>`;
                    } else {
                        e.target.style.background = '#fce8e6';
                        e.target.style.borderColor = '#ea4335';
                        e.target.style.color = '#c5221f';
                        explDiv.innerHTML = `<div style="padding:10px; background:#fdf5f5; border-left:4px solid #ea4335; font-size:0.85rem; border-radius:4px; color:#c5221f;"><strong>❌ Kurang Tepat.</strong> Jawaban: <strong>${currentQuiz.answer}</strong><br>${currentQuiz.explanation}</div>`;
                    }

                    // Tampilkan tombol lanjut setelah menjawab
                    nextBtn.style.display = 'block';
                };
            });

            nextBtn.onclick = () => {
                currentQuestionIndex++;
                if (currentQuestionIndex < quizzes.length) {
                    displayQuestion();
                } else {
                    // Hitung nilai akhir berbasis skala 100 untuk sesi ini
                    const finalSessionScore = Math.round((correctAnswersCount / quizzes.length) * 100);
                    window.globalScores[scoreKey] = finalSessionScore;

                    targetContainer.innerHTML = `
                        <div style="text-align:center; padding:20px; background:#e8f0fe; border-radius:12px; border:1px solid #b4cffc; margin-top:15px;">
                            <h4 style="margin:0 0 5px 0; color:#185abc;">Sesi Latihan Selesai! 🎉</h4>
                            <p style="margin:0; font-size:0.9rem;">Kamu menjawab benar <strong>${correctAnswersCount} dari 5 soal</strong>.</p>
                            <p style="margin:5px 0 0 0; font-size:1.1rem; font-weight:bold; color:#1a73e8;">Nilai Disimpan: ${finalSessionScore}</p>
                        </div>
                    `;
                }
            };
        }

        displayQuestion();
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
