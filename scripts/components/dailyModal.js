// FUNGSI UTAMA PENGAMBIL MATERI (TETAP FRESH SETIAP REFRESH)
async function getOrFetchBulkMaterial(type) {
    // Dipanggil langsung ke backend tanpa mengendap di cache 24 jam
    const res = await fetch(`/api/${type}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            action: 'get-material-bulk',
            timestamp: Date.now() // Mencegah caching oleh browser
        })
    });
    
    const freshBulkData = await res.json();
    
    // Jika balasan berupa Array (misal: 5 kata vocab atau 5 topik grammar)
    if (Array.isArray(freshBulkData)) {
        return freshBulkData;
    } 
    // Jika balasan berupa Objek tunggal
    return freshBulkData;
}

// FUNGSI UTAMA MEMBUKA MODAL DAN MENJALANKAN KUIS
export async function openDailyModal(type, container) {
    const dailyModal = container.querySelector('#daily-modal');
    const modalBody = container.querySelector('#modal-body-data');
    const closeModalBtn = container.querySelector('#close-modal-btn');

    if (!dailyModal || !modalBody) return;

    if (closeModalBtn) {
        closeModalBtn.onclick = () => { dailyModal.style.display = 'none'; };
    }

    modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Memuat materi teracak dari AI Harian...</div>`;
    dailyModal.style.display = 'flex';

    try {
        const material = await getOrFetchBulkMaterial(type);

        if (type === 'vocab') {
            // Ambil daftar kata (bisa langsung array atau di dalam property words/vocabList)
            const wordsList = Array.isArray(material) ? material : (material.words || [material]);
            const themeTitle = material.theme || (wordsList[0] && wordsList[0].theme) || 'Daily Vocab';

            let html = `<h3 style="margin-top:0; color:#1a73e8;">📚 Tema: ${themeTitle}</h3><ol style="padding-left:20px; text-align:left; font-size:0.95rem;">`;
            
            wordsList.forEach(w => {
                html += `<li style="margin-bottom:8px;"><strong>${w.word}</strong>: ${w.meaning}<br><small style="color:gray;">Ex: <em>${w.example}</em></small></li>`;
            });
            
            html += `</ol><hr style="margin:15px 0;"><div id="quiz-loading-area" style="text-align:center; color:gray;">⏳ AI sedang meramu soal evaluasi...</div>`;
            modalBody.innerHTML = html;
        } else {
            // Untuk Grammar
            const grammarList = Array.isArray(material) ? material : [material];
            let html = `<h3 style="margin-top:0; color:#137333;">⚙️ Topik Grammar Harian</h3><div style="text-align:left;">`;

            grammarList.forEach((g, idx) => {
                html += `
                    <div style="background:#f4faf6; padding:10px 12px; border-radius:8px; border-left:4px solid #34a853; margin-bottom:10px; color:#137333;">
                        <strong>${idx + 1}. ${g.topic || g.title}</strong>
                        <p style="margin:4px 0; font-size:0.9rem;">${g.explanation}</p>
                        <small><strong>Pola:</strong> <code>${g.formula}</code></small>
                    </div>
                `;
            });

            html += `</div><hr style="margin:15px 0;"><div id="quiz-loading-area" style="text-align:center; color:gray;">⏳ Menyiapkan kuis penguji...</div>`;
            modalBody.innerHTML = html;
        }

        // Endpoint fetch kuis diarahkan ke /api/vocab atau /api/grammar
        const quizRes = await fetch(`/api/${type}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'get-quizzes', currentMaterial: material, timestamp: Date.now() })
        });
        
        const quizData = await quizRes.json();
        const quizzes = quizData.quizzes || (Array.isArray(quizData) ? quizData : []);

        const loadingArea = modalBody.querySelector('#quiz-loading-area');
        if (loadingArea) {
            loadingArea.outerHTML = `<div id="quiz-container-area"></div>`;
            renderMiniQuizSystem(quizzes, type, modalBody.querySelector('#quiz-container-area'));
        }

    } catch (err) {
        console.error("Error modal:", err);
        modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ Gagal memuat materi harian. Silakan coba lagi.</p>`;
    }
}

// SISTEM MINI KUIS INTERAKTIF
function renderMiniQuizSystem(quizzes, scoreKey, targetContainer) {
    if (!quizzes || quizzes.length === 0) {
        targetContainer.innerHTML = `<p style="color:gray; text-align:center;">Gagal meramu kuis harian.</p>`;
        return;
    }

    let currentIndex = 0; 
    let correctCount = 0;

    function show() {
        const q = quizzes[currentIndex];
        targetContainer.innerHTML = `
            <div style="text-align:left; background:#fafafa; padding:15px; border-radius:10px; border:1px solid #eaeaea; margin-top:10px;">
                <p style="font-size:0.8rem; color:gray; font-weight:bold; margin:0 0 5px 0;">🎯 Soal (${currentIndex+1}/${quizzes.length})</p>
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
                    targetContainer.querySelector('#expl-area').innerHTML = `<div style="color:#137333; font-size:0.85rem;">🎉 <strong>Benar!</strong> ${q.explanation || ''}</div>`;
                } else {
                    e.target.style.background = '#fce8e6';
                    targetContainer.querySelector('#expl-area').innerHTML = `<div style="color:#c5221f; font-size:0.85rem;">❌ <strong>Salah.</strong> Jawaban: ${q.answer}. ${q.explanation || ''}</div>`;
                }
                targetContainer.querySelector('#next-b').style.display = 'block';
            };
        });

        targetContainer.querySelector('#next-b').onclick = () => {
            currentIndex++;
            if(currentIndex < quizzes.length) { 
                show(); 
            } else {
                const finalSc = Math.round((correctCount / quizzes.length) * 100);
                if (window.updateGlobalScore) {
                    window.updateGlobalScore(scoreKey, finalSc);
                }
                targetContainer.innerHTML = `<div style="text-align:center; padding:15px; background:#e8f0fe; border-radius:12px; margin-top:10px; font-weight:bold; color:#1a73e8;">Sesi Selesai! Nilai Tersimpan: ${finalSc}</div>`;
            }
        };
    }
    show();
}
