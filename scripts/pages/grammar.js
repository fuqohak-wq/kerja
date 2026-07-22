export function renderGrammar(container) {
    container.innerHTML = `
        <div class="welcome-section">
            <h2>⚙️ Grammar Practice</h2>
            <p>Pahami tata bahasa Inggris dengan penjelasan interaktif dari AI Tutor.</p>
        </div>

        <div class="reading-container">
            <div id="grammar-content" style="text-align:center; padding:20px;">
                <p>⏳ AI sedang merancang materi & kuis tata bahasa hari ini...</p>
            </div>
        </div>
    `;

    const grammarContent = container.querySelector('#grammar-content');

    fetch('/api/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-fresh', timestamp: Date.now() })
    })
    .then(res => res.json())
    .then(data => {
        const topics = data.topics || data.material || [data];
        const quizzes = data.quizzes || [];

        let html = `<div style="text-align:left; margin-bottom:20px;">`;
        topics.forEach((g, idx) => {
            html += `
                <div style="background:#f4faf6; padding:12px; border-radius:8px; border-left:4px solid #34a853; margin-bottom:12px; color:#137333;">
                    <h4 style="margin:0 0 5px 0;">${idx + 1}. ${g.topic || g.title || 'Grammar Concept'}</h4>
                    <p style="margin:4px 0; font-size:0.95rem;">${g.explanation}</p>
                    <small><strong>Rumus/Pola:</strong> <code>${g.formula || '-'}</code></small>
                </div>
            `;
        });
        html += `</div><hr style="margin:20px 0;"><div id="quiz-area"></div>`;

        grammarContent.innerHTML = html;
        renderQuizSystem(quizzes, 'grammar', grammarContent.querySelector('#quiz-area'));
    })
    .catch(err => {
        grammarContent.innerHTML = `<p style="color:red;">⚠️ Gagal memuat Grammar dari AI. Silakan coba lagi.</p>`;
    });
}

function renderQuizSystem(quizzes, scoreKey, container) {
    if (!quizzes || quizzes.length === 0) {
        container.innerHTML = `<p style="color:gray;">Kuis tidak tersedia.</p>`;
        return;
    }

    let currentIndex = 0;
    let correctCount = 0;

    function showQuestion() {
        const q = quizzes[currentIndex];
        container.innerHTML = `
            <div style="text-align:left; background:#f8f9fa; padding:15px; border-radius:10px; border:1px solid #ddd;">
                <p style="font-size:0.85rem; color:gray; font-weight:bold; margin:0 0 5px 0;">🎯 Soal Kuis (${currentIndex + 1}/${quizzes.length})</p>
                <p style="margin:0 0 12px 0; font-weight:bold;">${q.question}</p>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${q.options.map(o => `<button class="opt-btn" data-val="${o}" style="text-align:left; padding:10px; background:#fff; border:1px solid #ccc; border-radius:8px; cursor:pointer;">${o}</button>`).join('')}
                </div>
                <div id="expl-box" style="margin-top:12px;"></div>
                <button id="btn-next-q" style="display:none; margin-top:15px; background:#34a853; color:white; border:none; padding:8px 20px; border-radius:6px; cursor:pointer; float:right;">Lanjut ➡️</button>
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
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#137333;">🎉 <strong>Benar!</strong> ${q.explanation || ''}</div>`;
                } else {
                    e.target.style.background = '#fce8e6';
                    container.querySelector('#expl-box').innerHTML = `<div style="color:#c5221f;">❌ <strong>Salah.</strong> Jawaban tepat: <strong>${q.answer}</strong></div>`;
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
                    <div style="text-align:center; padding:20px; background:#e6f4ea; border-radius:12px; color:#137333;">
                        <h3>🎉 Selesai Latihan Grammar!</h3>
                        <p style="font-size:1.3rem; font-weight:bold; margin:10px 0;">Skor Kamu: ${score} / 100</p>
                        <p style="font-size:0.9rem; color:#5f6368;">Nilai ini telah otomatis tersimpan ke Laporan Harian.</p>
                    </div>
                `;
            }
        };
    }
    showQuestion();
}
