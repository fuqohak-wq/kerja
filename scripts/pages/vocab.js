export function renderVocab(container) {
    container.innerHTML = `
        <div class="welcome-section">
            <h2>📚 Daily Vocabulary</h2>
            <p>Hemat kuota & cepat! Mengambil 5 kata dari batch harianmu.</p>
        </div>

        <div class="reading-container" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #dadce0; max-width:800px; margin:0 auto;">
            <div id="vocab-content" style="text-align:center; padding:20px;">
                <p>⏳ Memuat kosakata harian...</p>
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

    // Cek apakah butuh panggil AI (jika belum ada data, beda hari, atau sisa kata < 5)
    const isNeedFetch = !localBatch || localBatch.date !== today || !localBatch.words || localBatch.words.length < 5;

    if (isNeedFetch) {
        vocabContent.innerHTML = `<p style="color:#1a73e8; font-weight:bold;">🤖 Mengontak AI untuk mengunduh 50 kosakata baru harian... (Cukup 1x sehari)</p>`;
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

    // Ambil 5 kata & 5 kuis terdepan
    const displayWords = localBatch.words.slice(0, 5);
    const displayQuizzes = localBatch.quizzes.slice(0, 5);

    // Rotasi: Simpan sisanya agar saat halaman dibuka berikutnya, muncul 5 kata SELANJUTNYA
    localBatch.words = localBatch.words.slice(5);
    localBatch.quizzes = localBatch.quizzes.slice(5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localBatch));

    // Render Tampilan
    let html = `<div style="text-align:left; margin-bottom:20px;">`;
    html += `<h3 style="color:#1a73e8; margin-top:0;">🌟 5 Kosakata Hari Ini (Sisa Paket AI: ${localBatch.words.length} Kata)</h3><ol style="padding-left:20px; line-height:1.8;">`;
    
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
        container.innerHTML = `<p style="color:gray;">Kuis latihan sudah selesai untuk sesi ini.</p>`;
        return;
    }

    let currentIndex = 0;
    let correctCount = 0;

    function showQuestion() {
        const q = quizzes[currentIndex];

        container.innerHTML = `
            <div style="text-align:left; background:#f8f9fa; padding:15px; border-radius:10px; border:1px solid #e0e0e0;">
                <p style="font-size:0.85rem; color:#1a73e8; font-weight:bold; margin:0 0 5px 0;">🎯 Soal Evaluasi (${currentIndex + 1}/${quizzes.length})</p>
                <p style="margin:0 0 12px 0; font-weight:bold; font-size:1rem; color:#202124;">${q.question}</p>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${q.options.map(o => `<button class="opt-btn" data-val="${o}" style="text-align:left; padding:10px 12px; background:#fff; border:1px solid #ccc; border-radius:8px; cursor:pointer; font-size:0.95rem;">${o}</button>`).join('')}
                </div>
                <div id="expl-box" style="margin-top:12px;"></div>
                <button id="btn-next-q" style="display:none; margin-top:15px; background:#1a73e8; color:white; border:none; padding:8px 20px; border-radius:6px; cursor:pointer; float:right; font-weight:bold;">Lanjut ➡️</button>
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
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#137333; font-size:0.9rem;">🎉 <strong>Benar!</strong> ${q.explanation || ''}</div>`;
                } else {
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#c5221f; font-size:0.9rem;">❌ <strong>Salah.</strong> Jawaban tepat: <strong>${q.answer}</strong>. ${q.explanation || ''}</div>`;
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
                    <div style="text-align:center; padding:20px; background:#e8f0fe; border-radius:12px; color:#1a73e8;">
                        <h3 style="margin:0 0 10px 0;">🎉 Selesai Latihan Vocab!</h3>
                        <p style="font-size:1.4rem; font-weight:bold; margin:5px 0;">Skor Kamu: ${score} / 100</p>
                        <p style="font-size:0.85rem; color:#5f6368; margin:0;">Nilai ini telah tersimpan dan siap dikirim ke Laporan Harian (B6).</p>
                    </div>
                `;
            }
        };
    }
    showQuestion();
}
