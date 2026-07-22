export function renderVocab(container) {
    container.innerHTML = `
        <div class="welcome-section">
            <h2>📚 Daily Vocabulary</h2>
            <p>Pelajari kata-kata baru hari ini dan uji pemahamanmu dengan kuis AI!</p>
        </div>

        <div class="reading-container" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #dadce0; max-width:800px; margin:0 auto;">
            <div id="vocab-content" style="text-align:center; padding:20px;">
                <p>⏳ AI sedang meramu 5 kosakata segar & kuis untukmu...</p>
            </div>
        </div>
    `;

    const vocabContent = container.querySelector('#vocab-content');

    // Fetch materi vocab dari backend
    fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-fresh', timestamp: Date.now() })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Response Vocab API:", data); // Untuk debugging di Console

        // Deteksi array kata dengan berbagai kemungkinan nama properti dari API
        let words = [];
        if (Array.isArray(data)) words = data;
        else if (Array.isArray(data.words)) words = data.words;
        else if (Array.isArray(data.vocabList)) words = data.vocabList;
        else if (Array.isArray(data.data)) words = data.data;

        // Deteksi array kuis
        let quizzes = [];
        if (Array.isArray(data.quizzes)) quizzes = data.quizzes;
        else if (Array.isArray(data.quiz)) quizzes = data.quiz;
        else if (data.quizzes && Array.isArray(data.quizzes.questions)) quizzes = data.quizzes.questions;

        const themeTitle = data.theme || data.title || 'Kosakata Harian';

        // 1. Tampilkan Daftar 5 Vocab
        let html = `<div style="text-align:left; margin-bottom:20px;">`;
        html += `<h3 style="color:#1a73e8; margin-top:0;">🌟 Topik: ${themeTitle}</h3>`;
        
        if (words.length > 0) {
            html += `<ol style="padding-left:20px; line-height:1.6;">`;
            words.forEach(w => {
                const kata = w.word || w.vocab || w.term || 'Kata';
                const arti = w.meaning || w.definition || w.arti || '-';
                const contoh = w.example || w.contoh || '';
                
                html += `<li style="margin-bottom:10px;">
                    <strong style="color:#1a73e8; font-size:1.05rem;">${kata}</strong>: ${arti}
                    ${contoh ? `<br><small style="color:#5f6368;">Contoh: <em>"${contoh}"</em></small>` : ''}
                </li>`;
            });
            html += `</ol>`;
        } else {
            html += `<p style="color:gray;">Materi kosakata berhasil dimuat. Silakan lanjutkan ke kuis di bawah.</p>`;
        }
        
        html += `</div><hr style="margin:20px 0; border:0; border-top:1px solid #eee;"><div id="quiz-area"></div>`;

        vocabContent.innerHTML = html;

        // 2. Tampilkan Sistem Kuis Penguji di Bawahnya
        renderQuizSystem(quizzes, 'vocab', vocabContent.querySelector('#quiz-area'));
    })
    .catch(err => {
        console.error("Error Vocab:", err);
        vocabContent.innerHTML = `<p style="color:#d93025;">⚠️ Gagal memuat Vocab dari AI. Silakan coba muat ulang halaman.</p>`;
    });
}

function renderQuizSystem(quizzes, scoreKey, container) {
    if (!quizzes || quizzes.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:15px; background:#f8f9fa; border-radius:8px;">
                <p style="color:#5f6368; margin:0;">💡 Latihan kosakata di atas sudah siap dipelajari!</p>
            </div>
        `;
        return;
    }

    let currentIndex = 0;
    let correctCount = 0;

    function showQuestion() {
        const q = quizzes[currentIndex];
        const opsi = q.options || q.choices || [];
        const pertanyaan = q.question || q.soal || 'Pilihlah jawaban yang tepat:';

        container.innerHTML = `
            <div style="text-align:left; background:#f8f9fa; padding:15px; border-radius:10px; border:1px solid #e0e0e0;">
                <p style="font-size:0.85rem; color:#1a73e8; font-weight:bold; margin:0 0 5px 0;">🎯 Soal Evaluasi (${currentIndex + 1}/${quizzes.length})</p>
                <p style="margin:0 0 12px 0; font-weight:bold; font-size:1rem;">${pertanyaan}</p>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${opsi.map(o => `<button class="opt-btn" data-val="${o}" style="text-align:left; padding:10px 12px; background:#fff; border:1px solid #ccc; border-radius:8px; cursor:pointer; font-size:0.95rem;">${o}</button>`).join('')}
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
                const kunciJawaban = q.answer || q.correctAnswer || q.jawaban;

                if (val === kunciJawaban) {
                    correctCount++;
                    e.target.style.background = '#e6f4ea';
                    e.target.style.borderColor = '#34a853';
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#137333; font-size:0.9rem;">🎉 <strong>Benar!</strong> ${q.explanation || ''}</div>`;
                } else {
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#c5221f; font-size:0.9rem;">❌ <strong>Salah.</strong> Jawaban tepat: <strong>${kunciJawaban}</strong>. ${q.explanation || ''}</div>`;
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
                        <h3 style="margin:0 0 10px 0;">🎉 Latihan Vocab Selesai!</h3>
                        <p style="font-size:1.4rem; font-weight:bold; margin:5px 0;">Skor Kamu: ${score} / 100</p>
                        <p style="font-size:0.85rem; color:#5f6368; margin:0;">Nilai ini telah tersimpan dan siap dikirim ke Laporan Harian (B6).</p>
                    </div>
                `;
            }
        };
    }
    showQuestion();
}
