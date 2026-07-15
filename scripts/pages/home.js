export function renderHome(container, changePageCallback) {
    container.innerHTML = `
        <div class="welcome-section">
            <h2>Inggris<span style="color:var(--primary-color);">ku</span></h2>
            <p>Pusat Pelatihan Mandiri AI. Pilih modul interaktif di bawah ini untuk memulai belajar!</p>
        </div>

        <div class="menu-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; max-width: 900px; margin: 0 auto; padding: 10px;">
            <div class="menu-card" data-page="speaking" style="background:#fff; border:1px solid #dadce0; padding:25px; border-radius:16px; cursor:pointer; transition:all 0.2s; text-align:center;">
                <div style="font-size:3rem; margin-bottom:10px;">🎤</div>
                <h3 style="margin:5px 0;">Speaking Tutor</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; margin:0;">Obrolan telepon suara interaktif bersama AI Coach.</p>
            </div>

            <div class="menu-card" data-page="listening" style="background:#fff; border:1px solid #dadce0; padding:25px; border-radius:16px; cursor:pointer; transition:all 0.2s; text-align:center;">
                <div style="font-size:3rem; margin-bottom:10px;">🎧</div>
                <h3 style="margin:5px 0;">Listening Practice</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; margin:0;">Kuis pemahaman audio 10 ronde berbasis tema unik AI.</p>
            </div>

            <div class="menu-card" data-page="reading" style="background:#fff; border:1px solid #dadce0; padding:25px; border-radius:16px; cursor:pointer; transition:all 0.2s; text-align:center;">
                <div style="font-size:3rem; margin-bottom:10px;">📖</div>
                <h3 style="margin:5px 0;">Reading Academy</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; margin:0;">Bacaan 3 paragraf dengan fitur ketuk-terjemah kata instan.</p>
            </div>

            <div class="menu-card" data-page="writing" style="background:#fff; border:1px solid #dadce0; padding:25px; border-radius:16px; cursor:pointer; transition:all 0.2s; text-align:center;">
                <div style="font-size:3rem; margin-bottom:10px;">✍️</div>
                <h3 style="margin:5px 0;">Writing Corrector</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; margin:0;">Analisis grammar esai mendalam beserta versi native speaker.</p>
            </div>

            <div class="menu-card dynamic-card" id="card-vocab" style="background: linear-gradient(135deg, #e8f0fe 0%, #ffffff 100%); border:1px solid #b4cffc; padding:25px; border-radius:16px; cursor:pointer; text-align:left; position:relative;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:2.5rem;">📚</span>
                    <span style="background:#1a73e8; color:#fff; font-size:0.75rem; padding:4px 8px; border-radius:12px; font-weight:bold;">10 Harian</span>
                </div>
                <h3 style="margin:10px 0 5px 0; color:#185abc;">Daily Vocabulary</h3>
                <p style="color:#5f6368; font-size:0.9rem; margin:0;">Kuasai 10 kosakata level Oxford baru & uji pemahaman kuis kilat sekarang.</p>
            </div>

            <div class="menu-card dynamic-card" id="card-grammar" style="background: linear-gradient(135deg, #e6f4ea 0%, #ffffff 100%); border:1px solid #a8dab5; padding:25px; border-radius:16px; cursor:pointer; text-align:left; position:relative;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:2.5rem;">⚙️</span>
                    <span style="background:#137333; color:#fff; font-size:0.75rem; padding:4px 8px; border-radius:12px; font-weight:bold;">Boost AI</span>
                </div>
                <h3 style="margin:10px 0 5px 0; color:#137333;">Grammar Booster</h3>
                <p style="color:#5f6368; font-size:0.9rem; margin:0;">Pelajari pola kalimat advance acak harian agar tulisanmu semakin matang.</p>
            </div>
        </div>

        <div id="daily-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center; padding:15px; box-sizing:border-box;">
            <div id="modal-content" style="background:#fff; width:100%; max-width:600px; max-height:85vh; overflow-y:auto; padding:25px; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.15); position:relative;">
                <button id="close-modal-btn" style="position:absolute; top:15px; right:15px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:#5f6368;">&times;</button>
                <div id="modal-body-data"></div>
            </div>
        </div>
    `;

    // Handler Navigasi 4 Menu Utama
    const cards = container.querySelectorAll('.menu-card:not(.dynamic-card)');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const page = card.getAttribute('data-page');
            changePageCallback(page);
        });
        // Efek Hover Ringan
        card.addEventListener('mouseover', () => card.style.transform = 'translateY(-4px)');
        card.addEventListener('mouseout', () => card.style.transform = 'translateY(0)');
    });

    // Handler Modal Fitur Baru Daily Vocab & Grammar
    const dailyModal = container.querySelector('#daily-modal');
    const modalBody = container.querySelector('#modal-body-data');
    const closeModalBtn = container.querySelector('#close-modal-btn');

    closeModalBtn.onclick = () => dailyModal.style.display = 'none';
    dailyModal.onclick = (e) => { if(e.target === dailyModal) dailyModal.style.display = 'none'; };

    // Klik Kumpulan Kosakata Harian
    container.querySelector('#card-vocab').onclick = async () => {
        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Meracik 10 kosakata baru khusus untukmu...</div>`;
        dailyModal.style.display = 'flex';

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'vocab'}) });
            const data = await res.json();
            
            let vocabHtml = `<h3>📚 10 Daily Vocabulary</h3><ol style="padding-left:20px; text-align:left; line-height:1.6; margin-bottom:20px;">`;
            data.words.forEach(w => {
                vocabHtml += `<li style="margin-bottom:10px;"><strong>${w.word}</strong> (${w.meaning})<br><span style="color:var(--text-muted); font-size:0.9rem;">Ex: <em>${w.example}</em></span></li>`;
            });
            vocabHtml += `</ol><hr style="border:0; border-top:1px solid #dadce0; margin:20px 0;">`;
            
            // Tambahkan Mini-Kuis Pembuktian
            vocabHtml += renderMiniQuiz(data.quiz);
            modalBody.innerHTML = vocabHtml;
            bindQuizEvents(data.quiz);
        } catch (e) {
            modalBody.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat materi. Coba klik ulang.</p>`;
        }
    };

    // Klik Modul Grammar Booster
    container.querySelector('#card-grammar').onclick = async () => {
        modalBody.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Menganalisis topik struktur kalimat advance harian...</div>`;
        dailyModal.style.display = 'flex';

        try {
            const res = await fetch('/api/daily', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: 'grammar'}) });
            const data = await res.json();
            
            let grammarHtml = `
                <h3 style="color:#137333;">⚙️ Grammar Booster: ${data.topic}</h3>
                <p style="text-align:left; line-height:1.6; font-size:1rem; background:#f4faf6; padding:15px; border-radius:8px; border-left:4px solid #34a853;">${data.explanation}</p>
                <p style="text-align:left;"><strong>Contoh Pola:</strong><br><code style="background:#f1f3f4; padding:3px 6px; border-radius:4px; font-size:1rem; display:block; margin-top:5px;">${data.formula}</code></p>
                <hr style="border:0; border-top:1px solid #dadce0; margin:20px 0;">
            `;
            
            grammarHtml += renderMiniQuiz(data.quiz);
            modalBody.innerHTML = grammarHtml;
            bindQuizEvents(data.quiz);
        } catch (e) {
            modalBody.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat materi grammar. Coba klik ulang.</p>`;
        }
    };

    function renderMiniQuiz(quiz) {
        return `
            <div class="mini-quiz-box" style="text-align:left;">
                <h4 style="margin:0 0 10px 0; color:var(--primary-color);">🎯 Uji Pemahaman Kilat:</h4>
                <p style="margin-bottom:12px; font-weight:500;">${quiz.question}</p>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${quiz.options.map(o => `<button class="option-btn daily-opt-btn" data-val="${o}" style="text-align:left; padding:10px; font-size:0.95rem; width:100%;">${o}</button>`).join('')}
                </div>
                <div id="daily-quiz-expl" style="margin-top:15px;"></div>
            </div>
        `;
    }

    function bindQuizEvents(quiz) {
        const btns = modalBody.querySelectorAll('.daily-opt-btn');
        const explDiv = modalBody.querySelector('#daily-quiz-expl');
        
        btns.forEach(btn => {
            btn.onclick = (e) => {
                const selected = e.target.getAttribute('data-val');
                btns.forEach(b => b.disabled = true);
                
                if (selected === quiz.answer) {
                    e.target.style.background = '#e6f4ea';
                    e.target.style.borderColor = '#34a853';
                    explDiv.innerHTML = `<div style="padding:10px; background:#f4faf6; border-left:4px solid #34a853; border-radius:4px; font-size:0.9rem;"><strong>🎉 Tepat Sekali!</strong><br>${quiz.explanation}</div>`;
                } else {
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    explDiv.innerHTML = `<div style="padding:10px; background:#fdf5f5; border-left:4px solid #ea4335; border-radius:4px; font-size:0.9rem;"><strong>📌 Kurang Tepat.</strong> Jawaban betul: <strong>${quiz.answer}</strong><br>${quiz.explanation}</div>`;
                }
            };
        });
    }
}
