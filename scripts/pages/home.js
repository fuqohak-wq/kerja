// Inisialisasi Score Holder Global jika belum ada di aplikasi
if (!window.globalScores) {
    window.globalScores = { speaking: 100, listening: 0, reading: 0, grammar: 0 };
}

export function renderHome(container, changePageCallback) {
    // --- 1. SUNTIK CSS MURNI UNTUK TAMPILAN CERAH GRADASI ---
    const styleId = 'theme-cerah-inggrisku-injector';
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
            .welcome-section {
                background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%) !important;
                color: white !important;
                padding: 20px !important;
                border-radius: 16px !important;
                box-shadow: 0 4px 15px rgba(26, 115, 232, 0.2) !important;
                text-align: center;
            }
            .welcome-section h2 { color: white !important; font-weight: 800 !important; }
            .welcome-section p { color: #ffeb3b !important; font-weight: bold !important; }

            .menu-grid .menu-card:nth-child(1) { border-left: 5px solid #1a73e8 !important; }
            .menu-grid .menu-card:nth-child(2) { border-left: 5px solid #e91e63 !important; }
            .menu-grid .menu-card:nth-child(3) { border-left: 5px solid #ff9800 !important; }
            .menu-grid .menu-card:nth-child(4) { border-left: 5px solid #9c27b0 !important; }
        `;
        document.head.appendChild(styleEl);
    }

    // --- 2. SISTEM INJEKSI ELEMEN AMAN (TIDAK MERUSAK KODE ASLI) ---
    // Gunakan setTimeout agar router selesai merender elemen aslinya terlebih dahulu
    setTimeout(() => {
        const menuGrid = container.querySelector('.menu-grid');
        if (!menuGrid) return; // Cari grid menu bawaan asli aplikasi

        // A. Suntik Tombol Daily Vocab (Jika Belum Ada)
        if (!container.querySelector('#card-vocab')) {
            const vocabCard = document.createElement('div');
            vocabCard.className = 'menu-card dynamic-card';
            vocabCard.id = 'card-vocab';
            vocabCard.style.cssText = 'background: linear-gradient(135deg, #e8f0fe 0%, #ffffff 100%); border:1px solid #b4cffc; padding:15px; border-radius:12px; cursor:pointer; text-align:center; transition: transform 0.2s;';
            vocabCard.innerHTML = `
                <div style="font-size:2rem; margin-bottom:5px;">📚</div>
                <h4 style="margin:0; color:#185abc; font-size:1rem;">Daily Vocab</h4>
                <p style="color:#5f6368; font-size:0.75rem; margin:3px 0 0 0;">10 Kata Baru & Kuis</p>
            `;
            menuGrid.appendChild(vocabCard);
            
            // Pasang Aksi Klik Daily Vocab
            vocabCard.onclick = () => bukaModalKonten('vocab');
        }

        // B. Suntik Tombol Grammar Booster (Jika Belum Ada)
        if (!container.querySelector('#card-grammar')) {
            const grammarCard = document.createElement('div');
            grammarCard.className = 'menu-card dynamic-card';
            grammarCard.id = 'card-grammar';
            grammarCard.style.cssText = 'background: linear-gradient(135deg, #e6f4ea 0%, #ffffff 100%); border:1px solid #a8dab5; padding:15px; border-radius:12px; cursor:pointer; text-align:center; transition: transform 0.2s;';
            grammarCard.innerHTML = `
                <div style="font-size:2rem; margin-bottom:5px;">⚙️</div>
                <h4 style="margin:0; color:#137333; font-size:1rem;">Grammar Booster</h4>
                <p style="color:#5f6368; font-size:0.75rem; margin:3px 0 0 0;">Pola Kalimat Esensial</p>
            `;
            menuGrid.appendChild(grammarCard);

            // Pasang Aksi Klik Grammar Booster
            grammarCard.onclick = () => bukaModalKonten('grammar');
        }

        // C. Suntik Tombol Evaluasi Akhir di Bawah Grid Menu (Jika Belum Ada)
        if (!container.querySelector('#eval-panel-custom')) {
            const evalPanel = document.createElement('div');
            evalPanel.id = 'eval-panel-custom';
            evalPanel.style.cssText = 'max-width: 800px; margin: 20px auto 0 auto; background: #fff; padding: 15px; border-radius: 12px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.04); border: 2px dashed #1a73e8;';
            evalPanel.innerHTML = `
                <h4 style="margin: 0 0 5px 0; color: #1a73e8; font-size: 1rem;">🏁 Evaluasi Akhir Belajar Hari Ini?</h4>
                <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #5f6368;">Hitung akumulasi seluruh nilai Anda dan kirim datanya langsung ke Google Sheet B6.</p>
                <button id="btn-submit-all-sessions" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; border: none; padding: 10px 25px; border-radius: 25px; font-size: 0.9rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(26,115,232,0.3);">Saya Selesai Ujian Hari Ini 🚀</button>
            `;
            menuGrid.parentNode.insertBefore(evalPanel, menuGrid.nextSibling);

            // Pasang Logika Kirim Nilai Google Sheet
            container.querySelector('#btn-submit-all-sessions').onclick = async (e) => {
                const btn = e.target;
                const scores = window.globalScores;
                const finalCalculatedScore = Math.round((scores.speaking + scores.listening + scores.reading + scores.grammar) / 4);

                if (!confirm(`Konfirmasi Selesai Ujian?\n\nRangkuman Nilai:\n- Speaking: ${scores.speaking}\n- Listening: ${scores.listening}\n- Reading: ${scores.reading}\n- Grammar: ${scores.grammar}\n\nRata-rata Nilai: ${finalCalculatedScore}\n\nNilai otomatis dikirim ke Spreadsheet tab DASHBOARD!B6.`)) {
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
                        alert(`🚀 Sukses! Nilai total (${finalCalculatedScore}) berhasil tersimpan di Google Sheet B6.`);
                    } else {
                        throw new Error(result.error);
                    }
                } catch (err) {
                    alert(`⚠️ Gagal Mengirim Nilai!\nDetail Error: ${err.message}`);
                } finally {
                    btn.disabled = false;
                    btn.innerText = "Saya Selesai Ujian Hari Ini 🚀";
                }
            };
        }

        // D. Buat Struktur Modal Secara Mandiri (Jika Belum Ada)
        if (!container.querySelector('#daily-modal')) {
            const modalEl = document.createElement('div');
            modalEl.id = 'daily-modal';
            modalEl.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; justify-content:center; align-items:center; padding:15px; box-sizing:border-box;';
            modalEl.innerHTML = `
                <div id="modal-content" style="background:#fff; width:100%; max-width:500px; max-height:80vh; overflow-y:auto; padding:20px; border-radius:16px; position:relative;">
                    <button id="close-modal-btn" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:1.8rem; cursor:pointer; color:#5f6368;">&times;</button>
                    <div id="modal-body-data" style="padding-top:10px;"></div>
                </div>
            `;
            container.appendChild(modalEl);
            container.querySelector('#close-modal-btn').onclick = () => modalEl.style.display = 'none';
        }

    }, 150);

    // --- 3. LOGIKA FUNGSI PANGGIL DATA AI (POP-UP MODAL) ---
    async function bukaModalKonten(type) {
        const dailyModal = container.querySelector('#daily-modal');
        const modalBody = container.querySelector('#modal-body-data');
        
        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Menghubungi AI untuk meracik materi baru...</div>`;
        dailyModal.style.display = 'flex';

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type }) });
            let text = await res.text();
            text = text.replace(/\\n/g, ' ').replace(/\\r/g, ' ');
            const data = JSON.parse(text);

            let html = '';
            if (type === 'vocab') {
                html += `<h3 style="margin-top:0;">📚 10 Kosakata Hari Ini</h3><ol style="padding-left:20px; text-align:left; font-size:0.95rem; line-height:1.5;">`;
                data.words.forEach(w => {
                    html += `<li style="margin-bottom:8px;"><strong>${w.word}</strong>: ${w.meaning}<br><small style="color:gray;">Ex: <em>${w.example}</em></small></li>`;
                });
                html += `</ol>`;
            } else {
                html += `
                    <h3 style="margin-top:0; color:#137333;">⚙️ Grammar Booster</h3>
                    <div style="background:#f4faf6; padding:12px; border-radius:8px; font-size:0.95rem; text-align:left; border-left:4px solid #34a853; margin-bottom:12px;">
                        <strong>${data.topic}</strong><br>${data.explanation}
                    </div>
                    <p style="text-align:left; font-size:0.9rem;"><strong>Pola/Contoh:</strong> <code style="background:#eee; padding:2px 6px; border-radius:4px; display:block; margin-top:3px;">${data.formula}</code></p>
                `;
            }

            html += `<hr style="border:0; border-top:1px solid #ddd; margin:15px 0;">` + renderMiniQuiz(data.quiz);
            modalBody.innerHTML = html;
            bindQuizEvents(data.quiz, type);

        } catch (e) {
            modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ Koneksi AI sibuk. Silakan tutup modal ini dan coba klik menunya kembali!</p>`;
        }
    }

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
        const btns = container.querySelectorAll('.daily-opt-btn');
        const explDiv = container.querySelector('#daily-quiz-expl');
        
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
}
