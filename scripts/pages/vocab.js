export function renderVocab(container) {
    container.innerHTML = `
        <div class="welcome-section">
            <h2>📚 Daily Vocabulary Challenge</h2>
            <p>Uji daya ingatmu dengan latihan kosakata harian terstruktur!</p>
        </div>

        <div class="reading-container" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #dadce0; max-width:800px; margin:0 auto;">
            <div id="vocab-content" style="text-align:center; padding:20px;">
                <p>⏳ Memuat materi kosakata...</p>
            </div>
        </div>
    `;

    const vocabContent = container.querySelector('#vocab-content');
    loadVocabBatch(vocabContent);
}

async function loadVocabBatch(vocabContent) {
    const today = new Date().toISOString().split('T')[0];
    const STORAGE_KEY = 'inggrisku_vocab_daily_5_v2';
    const SEEN_WORDS_KEY = 'inggrisku_seen_vocab';

    let localBatch = null;
    try {
        localBatch = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {}

    let seenWords = [];
    try {
        seenWords = JSON.parse(localStorage.getItem(SEEN_WORDS_KEY)) || [];
    } catch (e) {}

    const isNeedFetch = !localBatch || localBatch.date !== today || !localBatch.words || localBatch.words.length < 5 || !localBatch.quizzes || localBatch.quizzes.length === 0;

    if (isNeedFetch) {
        vocabContent.innerHTML = `<p style="color:#1a73e8; font-weight:bold;" id="vocab-status-text">🤖 Meminta AI menyiapkan 5 kata baru & kuis harian...</p>`;
        
        const maxRetries = 2;
        let attempt = 0;
        let success = false;

        while (attempt <= maxRetries && !success) {
            try {
                attempt++;
                const statusEl = vocabContent.querySelector('#vocab-status-text');
                if (statusEl && attempt > 1) {
                    statusEl.innerText = `🤖 Menghubungkan ulang ke AI Vocab (Percobaan ${attempt}/${maxRetries + 1})...`;
                }

                const res = await fetch('/api/vocab', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'get-batch-5',
                        exclude: seenWords
                    })
                });

                const data = await res.json();

                if (!res.ok || !data.words || data.words.length === 0) {
                    throw new Error(data.error || "Gagal mendapatkan data dari AI");
                }

                localBatch = {
                    date: today,
                    words: data.words.slice(0, 5),
                    quizzes: data.quizzes
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(localBatch));

                const newWords = data.words.map(w => w.word.toLowerCase());
                const updatedSeenWords = Array.from(new Set([...seenWords, ...newWords]));
                
                if (updatedSeenWords.length > 150) {
                    updatedSeenWords.splice(0, updatedSeenWords.length - 150);
                }
                localStorage.setItem(SEEN_WORDS_KEY, JSON.stringify(updatedSeenWords));
                success = true;

            } catch (err) {
                console.warn(`[Vocab Retry Warning] Percobaan ke-${attempt} gagal:`, err.message);
                if (attempt > maxRetries) {
                    vocabContent.innerHTML = `
                        <div style="padding:15px; background:#fdf5f5; border:1px solid #f5c6cb; border-radius:8px; color:#721c24;">
                            <p style="margin:0 0 10px 0; font-weight:bold;">⚠️ Kendala Koneksi AI</p>
                            <p style="margin:0 0 15px 0; font-size:0.9rem;">${err.message}</p>
                            <button id="btn-reload-vocab" style="background:#1a73e8; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold;">🔄 Coba Lagi</button>
                        </div>
                    `;
                    const btnReload = vocabContent.querySelector('#btn-reload-vocab');
                    if (btnReload) {
                        btnReload.onclick = () => loadVocabBatch(vocabContent);
                    }
                    return;
                } else {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
    }

    const displayWords = localBatch.words;
    const displayQuizzes = localBatch.quizzes;

    let html = `<div style="text-align:left; margin-bottom:20px;">`;
    html += `<h3 style="color:#1a73e8; margin-top:0;">🌟 5 Kosakata Unggulan Hari Ini</h3><ol style="padding-left:20px; line-height:1.8;">`;
    
    displayWords.forEach(w => {
        const pronText = w.pronunciation ? ` <span style="color:#5f6368; font-style:italic; font-weight:normal; font-size:0.9rem;">(${w.pronunciation})</span>` : '';
        html += `<li style="margin-bottom:12px;">
            <strong style="color:#1a73e8; font-size:1.05rem;">${w.word}</strong>${pronText}: ${w.meaning}
            <br><small style="color:#5f6368;">Contoh: <em>"${w.example}"</em></small>
        </li>`;
    });
    
    html += `</ol></div><hr style="margin:20px 0; border:0; border-top:1px solid #eee;"><div id="quiz-area"></div>`;

    vocabContent.innerHTML = html;
    renderQuizSystem(displayQuizzes, 'vocab', vocabContent.querySelector('#quiz-area'));
}

function renderQuizSystem(quizzes, scoreKey, container) {
    if (!quizzes || quizzes.length === 0) {
        container.innerHTML = `<p style="color:gray;">Kuis tidak tersedia saat ini.</p>`;
        return;
    }

    let currentIndex = 0;
    let correctCount = 0;

    function showQuestion() {
        const q = quizzes[currentIndex];
        
        let badgeColor = "#1a73e8";
        let badgeLabel = "💡 Tebak Arti";
        if (q.type === 'fill-in-blank') {
            badgeColor = "#e37400";
            badgeLabel = "✍️ Isi Bagian Rumpang";
        } else if (q.type === 'definition') {
            badgeColor = "#137333";
            badgeLabel = "🧩 Cocokkan Definisi";
        }

        container.innerHTML = `
            <div style="text-align:left; background:#f8f9fa; padding:18px; border-radius:12px; border:1px solid #e0e0e0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span style="font-size:0.85rem; color:#1a73e8; font-weight:bold;">🎯 Soal ${currentIndex + 1} dari ${quizzes.length}</span>
                    <span style="background:${badgeColor}; color:#fff; font-size:0.75rem; padding:3px 8px; border-radius:12px; font-weight:bold;">${badgeLabel}</span>
                </div>
                <p style="margin:0 0 15px 0; font-weight:bold; font-size:1.05rem; color:#202124; line-height:1.5;">${q.question}</p>
                
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${q.options.map(o => `<button class="opt-btn" data-val="${o.replace(/"/g, '&quot;')}" style="text-align:left; padding:11px 14px; background:#fff; border:1px solid #ccc; border-radius:8px; cursor:pointer; font-size:0.95rem; font-weight:500;">${o}</button>`).join('')}
                </div>
                
                <div id="expl-box" style="margin-top:12px;"></div>
                <button id="btn-next-q" style="display:none; margin-top:15px; background:#1a73e8; color:white; border:none; padding:10px 22px; border-radius:6px; cursor:pointer; float:right; font-weight:bold;">Soal Berikutnya ➡️</button>
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
                    e.currentTarget.style.color = '#137333';
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#137333; font-size:0.9rem; background:#e6f4ea; padding:8px 12px; border-radius:6px;">🎉 <strong>Benar!</strong> ${q.explanation || ''}</div>`;
                } else {
                    e.currentTarget.style.background = '#fce8e6';
                    e.currentTarget.style.borderColor = '#ea4335';
                    e.currentTarget.style.color = '#c5221f';
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#c5221f; font-size:0.9rem; background:#fce8e6; padding:8px 12px; border-radius:6px;">❌ <strong>Salah.</strong> Jawaban tepat: <strong>${q.answer}</strong>. ${q.explanation || ''}</div>`;
                }
                container.querySelector('#btn-next-q').style.display = 'block';
            };
        });

        container.querySelector('#btn-next-q').onclick = () => {
            currentIndex++;
            if (currentIndex < quizzes.length) {
                showQuestion();
            } else {
                const finalScore = Math.round((correctCount / quizzes.length) * 100);
                
                if (window.updateGlobalScore) {
                    window.updateGlobalScore(scoreKey, finalScore);
                }

                container.innerHTML = `
                    <div style="text-align:center; padding:25px; background:#e8f0fe; border-radius:12px; color:#1a73e8;">
                        <h3 style="margin:0 0 10px 0;">🏆 Latihan Vocabulary Selesai!</h3>
                        <p style="font-size:1.1rem; margin:5px 0;">Jawaban Benar: <strong>${correctCount} / ${quizzes.length}</strong></p>
                        <p style="font-size:1.8rem; font-weight:bold; margin:10px 0; color:#1a73e8;">NILAI AKHIR: ${finalScore}</p>
                        <p style="font-size:0.85rem; color:#5f6368; margin:0;">Nilai ini telah otomatis diperbarui di Dashboard.</p>
                    </div>
                `;
            }
        };
    }
    showQuestion();
}
