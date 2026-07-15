// FUNGSI UTAMA PENGAMBIL MATERI BERBASIS CACHE 24 JAM
async function getOrFetchBulkMaterial(type) {
    const cacheKey = `bulk_${type}_data`;
    const cacheTimeKey = `bulk_${type}_timestamp`;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (cachedData && cachedTime && (Date.now() - cachedTime < oneDay)) {
        const list = JSON.parse(cachedData);
        return list[Math.floor(Math.random() * list.length)];
    }

    // Endpoint diarahkan secara spesifik ke /api/vocab atau /api/grammar
    const res = await fetch(`/api/${type}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'get-material-bulk' })
    });
    const freshBulkData = await res.json();
    
    localStorage.setItem(cacheKey, JSON.stringify(freshBulkData));
    localStorage.setItem(cacheTimeKey, Date.now().toString());
    
    return freshBulkData[Math.floor(Math.random() * freshBulkData.length)];
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

    modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Memuat materi teracak dari arsip harian...</div>`;
    dailyModal.style.display = 'flex';

    try {
        const material = await getOrFetchBulkMaterial(type);

        if (type === 'vocab') {
            let html = `<h3 style="margin-top:0; color:#1a73e8;">📚 Tema Acak: ${material.theme}</h3><ol style="padding-left:20px; text-align:left; font-size:0.95rem;">`;
            material.words.forEach(w => {
                html += `<li style="margin-bottom:8px;"><strong>${w.word}</strong>: ${w.meaning}<br><small style="color:gray;">Ex: <em>${w.example}</em></small></li>`;
            });
            html += `</ol><hr style="margin:15px 0;"><div id="quiz-loading-area" style="text-align:center; color:gray;">⏳ AI sedang meramu soal evaluasi...</div>`;
            modalBody.innerHTML = html;
        } else {
            let html = `
                <h3 style="margin-top:0; color:#137333;">⚙️ Topik: ${material.topic}</h3>
                <div style="background:#f4faf6; padding:12px; border-radius:8px; text-align:left; border-left:4px solid #34a853; margin-bottom:12px; color:#137333;">${material.explanation}</div>
                <p style="text-align:left;"><strong>Pola Kalimat:</strong> <code style="background:#eee; padding:4px 8px; display:block; margin-top:3px;">${material.formula}</code></p>
                <hr style="margin:15px 0;"><div id="quiz-loading-area" style="text-align:center; color:gray;">⏳ Menyiapkan kuis penguji...</div>
            `;
            modalBody.innerHTML = html;
        }

        // Endpoint fetch kuis diarahkan ke /api/vocab atau /api/grammar
        const quizRes = await fetch(`/api/${type}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'get-quizzes', currentMaterial: material })
        });
        const quizData = await quizRes.json();
        
        modalBody.querySelector('#quiz-loading-area').outerHTML = `<div id="quiz-container-area"></div>`;
        renderMiniQuizSystem(quizData.quizzes, type, modalBody.querySelector('#quiz-container-area'));

    } catch (err) {
        modalBody.innerHTML = `<p style="color:red; text-align:center;">⚠️ Gagal memuat materi harian. Silakan coba lagi.</p>`;
    }
}

// SISTEM MINI KUIS INTERAKTIF
function renderMiniQuizSystem(quizzes, scoreKey, targetContainer) {
    let currentIndex = 0; 
    let correctCount = 0;

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
            if(currentIndex < quizzes.length) { 
                show(); 
            } else {
                const finalSc = Math.round((correctCount / quizzes.length) * 100);
                window.globalScores[scoreKey] = finalSc;
                targetContainer.innerHTML = `<div style="text-align:center; padding:15px; background:#e8f0fe; border-radius:12px; margin-top:10px; font-weight:bold; color:#1a73e8;">Sesi Selesai! Nilai Tersimpan: ${finalSc}</div>`;
            }
        };
    }
    show();
}
