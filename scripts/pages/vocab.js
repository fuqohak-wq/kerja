export function renderVocab(container) {
    container.innerHTML = `
        <div class="welcome-section">
            <h2>📚 Daily Vocabulary Challenge</h2>
            <p>Uji daya ingatmu dengan 20 soal variatif buatan AI!</p>
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
    const STORAGE_KEY = 'inggrisku_vocab_batch_50';

    let localBatch = null;
    try {
        localBatch = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {}

    // Ambil data baru jika belum ada, beda hari, atau kuis kurang dari 20
    const isNeedFetch = !localBatch || localBatch.date !== today || !localBatch.words || !localBatch.quizzes || localBatch.quizzes.length < 20;

    if (isNeedFetch) {
        vocabContent.innerHTML = `<p style="color:#1a73e8; font-weight:bold;">🤖 Meminta AI menyiapkan 50 kata & 20 Soal Variatif... (Cukup 1x sehari)</p>`;
        try {
            const res = await fetch('/api/vocab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-batch-50' })
            });
            const data = await res.json();

            if (!res.ok || !data.words || data.words.length === 0) {
                throw new Error(data.error || "Gagal mendapatkan data dari AI");
            }

            localBatch = {
                date: today,
                words: data.words,
                quizzes: data.quizzes || []
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localBatch));

        } catch (err) {
            vocabContent.innerHTML = `<p style="color:#d93025;">⚠️ Gagal memuat AI: ${err.message}. Silakan coba lagi.</p>`;
            return;
        }
    }

    // Ambil 5 kata untuk dipelajari & 20 SOAL KUIS
    const displayWords = localBatch.words.slice(0, 5);
    const displayQuizzes = localBatch.quizzes.slice(0, 20); // Ambil 20 Soal

    let html = `<div style="text-align:left; margin-bottom:20px;">`;
    html += `<h3 style="color:#1a73e8; margin-top:0;">🌟 5 Kosakata Unggulan Hari Ini</h3><ol style="padding-left:20px; line-height:1.8;">`;
    
    displayWords.forEach(w => {
        html += `<li style="margin-bottom:12px;">
            <strong style="color:#1a73e8; font-size:1.05rem;">${w.word}</strong>: ${w.meaning}
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
        
        // Custom Badge Tipe Soal
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
                    ${q.options.map(o => `<button class="opt-btn" data-val="${o}" style="text-align:left; padding:11px 14px; background:#fff; border:1px solid #ccc; border-radius:8px; cursor:pointer; font-size:0.95rem; font-weight:500;">${o}</button>`).join('')}
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
                const val = e.target.getAttribute('data-val');

                if (val === q.answer) {
                    correctCount++;
                    e.target.style.background = '#e6f4ea';
                    e.target.style.borderColor = '#34a853';
                    e.target.style.color = '#137333';
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#137333; font-size:0.9rem; background:#e6f4ea; padding:8px 12px; border-radius:6px;">🎉 <strong>Benar!</strong> ${q.explanation || ''}</div>`;
                } else {
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    e.target.style.color = '#c5221f';
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
                // LOGIKA SKOR TETAP MAKSIMAL 100
                const finalScore = Math.round((correctCount / quizzes.length) * 100);
                
                if (window.updateGlobalScore) {
                    window.updateGlobalScore(scoreKey, finalScore);
                }

                container.innerHTML = `
                    <div style="text-align:center; padding:25px; background:#e8f0fe; border-radius:12px; color:#1a73e8;">
                        <h3 style="margin:0 0 10px 0;">🏆 Latihan 20 Soal Selesai!</h3>
                        <p style="font-size:1.1rem; margin:5px 0;">Jawaban Benar: <strong>${correctCount} / 20</strong></p>
                        <p style="font-size:1.8rem; font-weight:bold; margin:10px 0; color:#1a73e8;">NILAI AKHIR: ${finalScore}</p>
                        <p style="font-size:0.85rem; color:#5f6368; margin:0;">Nilai ini telah otomatis diperbarui di Dashboard dan siap dikirim ke Google Sheet Sel B6.</p>
                    </div>
                `;
            }
        };
    }
    showQuestion();
}
