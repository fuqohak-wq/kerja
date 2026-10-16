export function renderGrammar(container) {
    container.innerHTML = `
        <div class="welcome-section">
            <h2>⚙️ Intensive Grammar Academy</h2>
            <p>Satu Pelajaran Fokus per Hari: Penjelasan Mendalam, Contoh Praktis & Kuis Evaluasi</p>
        </div>

        <div class="reading-container" style="background:#fff; padding:25px; border-radius:12px; border:1px solid #dadce0; max-width:850px; margin:0 auto; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
            <div id="grammar-content" style="text-align:center; padding:10px;">
                <p>⏳ Memuat materi grammar harian...</p>
            </div>
        </div>
    `;

    const grammarContent = container.querySelector('#grammar-content');
    loadGrammarBatch(grammarContent);
}

async function loadGrammarBatch(grammarContent) {
    const today = new Date().toISOString().split('T')[0];
    const STORAGE_KEY = 'inggrisku_grammar_detail_v1';

    let localData = null;
    try {
        localData = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {}

    const isNeedFetch = !localData || localData.date !== today || !localData.topic;

    if (isNeedFetch) {
        grammarContent.innerHTML = `<p style="color:#34a853; font-weight:bold;" id="grammar-status-text">🤖 Mengunduh modul pelajaran Grammar harian dari AI...</p>`;
        
        const maxRetries = 2;
        let attempt = 0;
        let success = false;

        while (attempt <= maxRetries && !success) {
            try {
                attempt++;
                const statusEl = grammarContent.querySelector('#grammar-status-text');
                if (statusEl && attempt > 1) {
                    statusEl.innerText = `🤖 Mencoba ulang terhubung ke AI (Percobaan ${attempt}/${maxRetries + 1})...`;
                }

                const res = await fetch('/api/grammar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: today })
                });

                const data = await res.json();

                if (!res.ok || !data.topic) {
                    throw new Error(data.error || "Gagal mendapatkan materi dari AI");
                }

                localData = {
                    date: today,
                    ...data
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
                success = true;

            } catch (err) {
                console.warn(`[Grammar Retry Warning] Percobaan ke-${attempt} gagal:`, err.message);
                if (attempt > maxRetries) {
                    grammarContent.innerHTML = `
                        <div style="padding:15px; background:#fdf5f5; border:1px solid #f5c6cb; border-radius:8px; color:#721c24;">
                            <p style="margin:0 0 10px 0; font-weight:bold;">⚠️ Kendala Koneksi AI</p>
                            <p style="margin:0 0 15px 0; font-size:0.9rem;">${err.message}</p>
                            <button id="btn-reload-grammar" style="background:#34a853; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold;">🔄 Coba Lagi</button>
                        </div>
                    `;
                    const btnReload = grammarContent.querySelector('#btn-reload-grammar');
                    if (btnReload) btnReload.onclick = () => loadGrammarBatch(grammarContent);
                    return;
                } else {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
    }

    // Tampilan Pelajaran Tunggal yang Detail
    let html = `
        <div style="text-align:left; margin-bottom:25px;">
            <div style="background:#e6f4ea; padding:15px 20px; border-radius:10px; border-left:5px solid #34a853; margin-bottom:20px;">
                <span style="font-weight:bold; color:#137333; font-size:0.85rem; text-transform:uppercase; letter-spacing:0.5px;">Fokus Utama Hari Ini</span>
                <h3 style="margin:5px 0 0 0; color:#137333; font-size:1.3rem;">📖 ${localData.topic}</h3>
            </div>

            <div style="line-height:1.7; color:#202124; font-size:1rem; margin-bottom:20px;">
                <h4 style="color:#137333; margin-bottom:8px;">💡 Penjelasan Konsep:</h4>
                <p style="margin-top:0; background:#f8f9fa; padding:12px; border-radius:8px; border:1px solid #eee;">${localData.explanation}</p>
            </div>

            <div style="margin-bottom:20px;">
                <h4 style="color:#137333; margin-bottom:8px;">📌 Pola / Rumus Kalimat:</h4>
                <div style="background:#f4faf6; padding:12px 15px; border-radius:8px; border:1px dashed #34a853; font-family:monospace; font-size:1rem; color:#137333; font-weight:bold;">
                    ${localData.formula || '-'}
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <h4 style="color:#137333; margin-bottom:8px;">📝 Contoh Kalimat Praktis:</h4>
                <ul style="padding-left:20px; margin:0;">
                    ${(localData.examples || []).map(ex => `
                        <li style="margin-bottom:10px;">
                            <strong style="color:#1a73e8;">"${ex.en}"</strong>
                            <br><span style="color:#5f6368; font-size:0.9rem;">Meaning: <em>${ex.id}</em></span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            ${localData.usageNotes ? `
                <div style="background:#fff8e1; border:1px solid #ffe082; padding:12px 15px; border-radius:8px; color:#8c6d00; font-size:0.9rem;">
                    <strong>⚠️ Catatan Penting:</strong> ${localData.usageNotes}
                </div>
            ` : ''}
        </div>
        <hr style="margin:25px 0; border:0; border-top:1px solid #dadce0;">
        <div id="quiz-area"></div>
    `;

    grammarContent.innerHTML = html;
    renderQuizSystem(localData.quizzes || [], 'grammar', grammarContent.querySelector('#quiz-area'));
}

function renderQuizSystem(quizzes, scoreKey, container) {
    if (!quizzes || quizzes.length === 0) {
        container.innerHTML = `<p style="color:gray;">Soal kuis tidak tersedia.</p>`;
        return;
    }

    let currentIndex = 0;
    let correctCount = 0;

    function showQuestion() {
        const q = quizzes[currentIndex];

        container.innerHTML = `
            <div style="text-align:left; background:#f8f9fa; padding:18px; border-radius:10px; border:1px solid #e0e0e0;">
                <p style="font-size:0.85rem; color:#34a853; font-weight:bold; margin:0 0 8px 0;">🎯 Uji Pemahaman (${currentIndex + 1}/${quizzes.length})</p>
                <p style="margin:0 0 15px 0; font-weight:bold; font-size:1.05rem; color:#202124;">${q.question}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${q.options.map(o => `<button class="opt-btn" data-val="${o.replace(/"/g, '&quot;')}" style="text-align:left; padding:11px 14px; background:#fff; border:1px solid #ccc; border-radius:8px; cursor:pointer; font-size:0.95rem;">${o}</button>`).join('')}
                </div>
                <div id="expl-box" style="margin-top:12px;"></div>
                <button id="btn-next-q" style="display:none; margin-top:15px; background:#34a853; color:white; border:none; padding:10px 22px; border-radius:6px; cursor:pointer; float:right; font-weight:bold;">Soal Lanjutan ➡️</button>
                <div style="clear:both;"></div>
            </div>
        `;

        const btns = container.querySelectorAll('.opt-btn');
        btns.forEach(btn => {
            btn.onclick = (e) => {
                btns.forEach(b => b.disabled = true);
                const val = e.currentTarget.getAttribute('data-val');

                if (val === q.answer) {
                    correctCount++;
                    e.currentTarget.style.background = '#e6f4ea';
                    e.currentTarget.style.borderColor = '#34a853';
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#137333; font-size:0.9rem; background:#e6f4ea; padding:10px; border-radius:6px;">🎉 <strong>Tepat Sekali!</strong> ${q.explanation || ''}</div>`;
                } else {
                    e.currentTarget.style.background = '#fce8e6';
                    e.currentTarget.style.borderColor = '#ea4335';
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#c5221f; font-size:0.9rem; background:#fce8e6; padding:10px; border-radius:6px;">❌ <strong>Kurang Tepat.</strong> Jawaban benar: <strong>${q.answer}</strong>.<br>${q.explanation || ''}</div>`;
                }
                container.querySelector('#btn-next-q').style.display = 'block';
            };
        });

        container.querySelector('#btn-next-q').onclick = () => {
            currentIndex++;
            if (currentIndex < quizzes.length) {
                showQuestion();
            } else {
                const score = Math.round((correctCount / quizzes.length) * 100);
                if (window.updateGlobalScore) {
                    window.updateGlobalScore(scoreKey, score);
                }
                container.innerHTML = `
                    <div style="text-align:center; padding:25px; background:#e6f4ea; border-radius:12px; color:#137333;">
                        <h3 style="margin:0 0 10px 0;">🎉 Evaluasi Grammar Selesai!</h3>
                        <p style="font-size:1.3rem; font-weight:bold; margin:5px 0;">Nilai Pemahaman: ${score} / 100</p>
                        <p style="font-size:0.85rem; color:#5f6368; margin:0;">Nilai ini telah otomatis diperbarui di Dashboard.</p>
                    </div>
                `;
            }
        };
    }
    showQuestion();
}
