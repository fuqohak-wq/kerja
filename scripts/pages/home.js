if (!window.globalScores) {
    window.globalScores = { speaking: 100, listening: 0, reading: 0, grammar: 0 };
}

export function renderHome(container) {
    container.innerHTML = `
        <div class="welcome-section" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 20px; border-radius: 16px; margin-bottom: 15px; text-align:center;">
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

        <div style="max-width: 800px; margin: 15px auto 0 auto; background: #fff; padding: 15px; border-radius: 12px; text-align: center; border: 2px dashed #1a73e8;">
            <h4 style="margin: 0 0 5px 0; color: #1a73e8; font-size: 1rem;">🏁 Evaluasi Akhir Belajar Hari Ini?</h4>
            <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #5f6368;">Kirim akumulasi nilai Anda langsung ke Google Sheet B6.</p>
            <button id="btn-submit-all-sessions" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; border: none; padding: 10px 25px; border-radius: 25px; font-weight: bold; cursor: pointer;">Saya Selesai Ujian Hari Ini 🚀</button>
        </div>

        <div id="daily-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; justify-content:center; align-items:center; padding:15px; box-sizing:border-box;">
            <div id="modal-content" style="background:#fff; width:100%; max-width:500px; max-height:85vh; overflow-y:auto; padding:20px; border-radius:16px; position:relative;">
                <button id="close-modal-btn" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:1.8rem; cursor:pointer; color:#5f6368;">&times;</button>
                <div id="modal-body-data" style="padding-top:10px;"></div>
            </div>
        </div>
    `;

    const dailyModal = container.querySelector('#daily-modal');
    const modalBody = container.querySelector('#modal-body-data');
    const closeModalBtn = container.querySelector('#close-modal-btn');

    if (closeModalBtn && dailyModal) {
        closeModalBtn.onclick = () => { dailyModal.style.display = 'none'; };
    }

    // FUNGSI UTAMA PENGAMBIL MATERI BERBASIS CACHE 24 JAM
    async function getOrFetchBulkMaterial(type) {
        const cacheKey = `bulk_${type}_data`;
        const cacheTimeKey = `bulk_${type}_timestamp`;
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);
        
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (cachedData && cachedTime && (Date.now() - cachedTime < oneDay)) {
            const list = JSON.parse(cachedData);
            // Ambil acak satu dari 50 materi di cache lokal
            return list[Math.floor(Math.random() * list.length)];
        }

        // Jika cache kosong/expired, baru hit ke API Gemini
        const res = await fetch('/api/daily', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'get-material-bulk', type: type })
        });
        const freshBulkData = await res.json();
        
        localStorage.setItem(cacheKey, JSON.stringify(freshBulkData));
        localStorage.setItem(cacheTimeKey, Date.now().toString());
        
        return freshBulkData[Math.floor(Math.random() * freshBulkData.length)];
    }

    // MANAJEMEN KLIK DAILY VOCAB
    container.querySelector('#card-vocab').onclick = async (e) => {
        e.stopPropagation();
        if (!dailyModal || !modalBody) return;
        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Mengambil materi teracak dari arsip harian...</div>`;
        dailyModal.style.display = 'flex';

        try {
            const material = await getOrFetchBulkMaterial('vocab');
            let html = `<h3 style="margin-top:0; color:#1a73e8;">📚 Tema Acak: ${material.theme}</h3><ol style="padding-left:20px; text-align:left; font-size:0.95rem;">`;
            material.words.forEach(w => {
                html += `<li style="margin-bottom:8px;"><strong>${w.word}</strong>: ${w.meaning}<br><small style="color:gray;">Ex: <em>${w.example}</em></small></li>`;
            });
            html += `</ol><hr style="margin:15px 0;"><div id="quiz-loading-area" style="text-align:center; color:gray;">⏳ AI sedang meramu soal evaluasi...</div>`;
            modalBody.innerHTML = html;

            const quizRes = await fetch('/api/daily', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'get-quizzes', currentMaterial: material })
            });
            const quizData = await quizRes.json();
            modalBody.querySelector('#quiz-loading-area').outerHTML = `<div id="quiz-container-area"></div>`;
            renderMiniQuizSystem(quizData.quizzes, 'vocab', modalBody.querySelector('#quiz-container-area'));
        } catch (err) {
            modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ Gagal memuat materi harian. Silakan coba lagi.</p>`;
        }
    };

    // MANAJEMEN KLIK GRAMMAR
    container.querySelector('#card-grammar').onclick = async (e) => {
        e.stopPropagation();
        if (!dailyModal || !modalBody) return;
        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Menyiapkan formula grammar acak hari ini...</div>`;
        dailyModal.style.display = 'flex';

        try {
            const material = await getOrFetchBulkMaterial('grammar');
            let html = `
                <h3 style="margin-top:0; color:#137333;">⚙️ Topik: ${material.topic}</h3>
                <div style="background:#f4faf6; padding:12px; border-radius:8px; text-align:left; border-left:4px solid #34a853; margin-bottom:12px; color:#137333;">${material.explanation}</div>
                <p style="text-align:left;"><strong>Pola Kalimat:</strong> <code style="background:#eee; padding:4px 8px; display:block; margin-top:3px;">${material.formula}</code></p>
                <hr style="margin:15px 0;"><div id="quiz-loading-area" style="text-align:center; color:gray;">⏳ Menyiapkan kuis penguji...</div>
            `;
            modalBody.innerHTML = html;

            const quizRes = await fetch('/api/daily', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'get-quizzes', currentMaterial: material })
            });
            const quizData = await quizRes.json();
            modalBody.querySelector('#quiz-loading-area').outerHTML = `<div id="quiz-container-area"></div>`;
            renderMiniQuizSystem(quizData.quizzes, 'grammar', modalBody.querySelector('#quiz-container-area'));
        } catch (err) {
            modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ Hubungan AI terputus. Sila coba kembali.</p>`;
        }
    };

    function renderMiniQuizSystem(quizzes, scoreKey, targetContainer) {
        let currentIndex = 0; let correctCount = 0;
        function show() {
            const q = quizzes[currentIndex];
            targetContainer.innerHTML = `
                <div style="text-align:left; background:#fafafa; padding:15px; border-radius:10px; border:1px solid #eaeaea; margin-top:10px;">
                    <p style="font-size:0.8rem; color:gray; font-weight:bold; margin:0 0 5px 0;">🎯 Soal (${currentIndex+1}/5)</p>
                    <p style="margin:0 0 12px 0; font-weight:bold;">${q.question}</p>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${q.options.map(o => `<button class="opt-b" data-v="${o}" style="text-align:left; padding:10px; background:#fff; border:1px solid #ddd; border-radius:8px; cursor:pointer;">${o}</button>`).join('')}
                    </div>
                    <div id="expl-area" style="margin-top:12px;"></div>
                    <button id="next-b" style="display:none; margin-top:15px; background:#1a73e8; color:white; border:none; padding:8px 20px; border-radius:6px; cursor:pointer; float:right;">Lanjut ➡️</button>
                    <div style="clear:both;"></div>
                </div>
            `;
            const buttons = targetContainer.querySelectorAll('.opt-b');
            buttons.forEach(b => {
                b.onclick = (e) => {
                    buttons.forEach(btn => btn.disabled = true);
                    const sel = e.target.getAttribute('data-v');
                    if(sel === q.answer) {
                        correctCount++;
                        e.target.style.background = '#e6f4ea';
                        targetContainer.querySelector('#expl-area').innerHTML = `<div style="color:#137333; font-size:0.85rem;">🎉 <strong>Benar!</strong> ${q.explanation}</div>`;
                    } else {
                        e.target.style.background = '#fce8e6';
                        targetContainer.querySelector('#expl-area').innerHTML = `<div style="color:#c5221f; font-size:0.85rem;">❌ <strong>Salah.</strong> Jawaban: ${q.answer}. ${q.explanation}</div>`;
                    }
                    targetContainer.querySelector('#next-b').style.display = 'block';
                };
            });
            targetContainer.querySelector('#next-b').onclick = () => {
                currentIndex++;
                if(currentIndex < quizzes.length) { show(); } 
                else {
                    const finalSc = Math.round((correctCount / quizzes.length) * 100);
                    window.globalScores[scoreKey] = finalSc;
                    targetContainer.innerHTML = `<div style="text-align:center; padding:15px; background:#e8f0fe; border-radius:12px; margin-top:10px; font-weight:bold; color:#1a73e8;">Sesi Selesai! Nilai Tersimpan: ${finalSc}</div>`;
                }
            };
        }
        show();
    }

    container.querySelector('#btn-submit-all-sessions').onclick = async (e) => {
        const sc = window.globalScores;
        const avg = Math.round((sc.speaking + sc.listening + sc.reading + sc.grammar) / 4);
        if(!confirm(`Kirim Rata-Rata Nilai (${avg}) ke Sel B6?`)) return;
        
        e.target.disabled = true; e.target.innerText = "Mengirim...";
        try {
            const res = await fetch('/api/submit-score', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ finalScore: avg })
            });
            const r = await res.json();
            if(r.success) alert("🚀 Sukses masuk ke Google Sheet!");
            else throw new Error(r.error);
        } catch(err) { alert("⚠️ Gagal: " + err.message); }
        finally { e.target.disabled = false; e.target.innerText = "Saya Selesai Ujian Hari Ini 🚀"; }
    };
}
