export function renderListening(container) {
    const themes = [
        { id: 'daily', label: '💬 Percakapan Sehari-hari' },
        { id: 'travel', label: '✈️ Bandara & Perjalanan' },
        { id: 'office', label: '💼 Dunia Kerja & Kantor' },
        { id: 'shopping', label: '🛍️ Belanja & Restoran' },
        { id: 'academic', label: '🎓 Perkuliahan & Pendidikan' }
    ];

    let currentRound = 0;
    let score = 0;
    let quizItems = [];
    let currentThemeLabel = "";

    container.innerHTML = `
        <div class="welcome-section">
            <h2>🎧 AI Listening Academy</h2>
            <p>Dengarkan percakapan bahasa Inggris dan jawab pertanyaan dengan tepat!</p>
        </div>
        <div class="listening-container" style="max-width:800px; margin:0 auto; padding:10px;">
            <div id="theme-selector" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-bottom:25px;">
                ${themes.map(t => `<button class="option-btn theme-btn" data-theme="${t.label}" style="width:auto; padding:10px 15px;">${t.label}</button>`).join('')}
            </div>

            <div id="listening-loading" style="display:none; text-align:center; margin:30px 0; color:var(--primary-color);">
                <span class="loading-spinner">⏳</span> AI sedang merancang 10 audio percakapan baru...
            </div>

            <div id="listening-zone" style="display:none;">
                <div id="quiz-progress" style="font-weight:bold; color:var(--primary-color); margin-bottom:15px; text-align:center;"></div>
                
                <div style="background:#fff; border:1px solid #dadce0; border-radius:12px; padding:20px; text-align:center; margin-bottom:20px;">
                    <button id="btn-play-audio" style="background:#1a73e8; color:white; border:none; padding:12px 25px; border-radius:30px; font-weight:bold; cursor:pointer; font-size:1rem;">
                        🔊 Putar Audio Percakapan
                    </button>
                    <p id="audio-status" style="font-size:0.85rem; color:gray; margin-top:8px;">Klik tombol di atas untuk mendengarkan.</p>
                </div>

                <div id="quiz-box" style="background:#f8f9fa; border:1px solid #dadce0; padding:20px; border-radius:12px; text-align:left;"></div>

                <button id="btn-next-listening" class="action-btn" style="background:var(--primary-color); display:none; margin:20px auto 0 auto; width:100%; max-width:400px;">Soal Selanjutnya ➡️</button>
            </div>

            <div id="result-zone" style="display:none; text-align:center; padding:30px 10px;"></div>
        </div>
    `;

    const themeSelector = container.querySelector('#theme-selector');
    const themeButtons = container.querySelectorAll('.theme-btn');
    const loadingDiv = container.querySelector('#listening-loading');
    const listeningZone = container.querySelector('#listening-zone');
    const progressDiv = container.querySelector('#quiz-progress');
    const playAudioBtn = container.querySelector('#btn-play-audio');
    const audioStatus = container.querySelector('#audio-status');
    const quizBox = container.querySelector('#quiz-box');
    const nextBtn = container.querySelector('#btn-next-listening');
    const resultZone = container.querySelector('#result-zone');

    themeButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            currentThemeLabel = e.target.getAttribute('data-theme');
            themeSelector.style.display = 'none';
            loadingDiv.style.display = 'block';

            try {
                const res = await fetch('/api/listening', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme: currentThemeLabel, timestamp: Date.now() })
                });

                if (!res.ok) throw new Error("Gagal mengambil data listening");
                const data = await res.json();

                quizItems = data.items || [];
                if (quizItems.length === 0) throw new Error("Daftar soal listening kosong");

                currentRound = 0;
                score = 0;
                loadingDiv.style.display = 'none';
                listeningZone.style.display = 'block';

                loadQuestion(currentRound);

            } catch (err) {
                console.error(err);
                loadingDiv.style.display = 'none';
                alert("Gagal memuat listening: " + err.message);
                themeSelector.style.display = 'flex';
            }
        });
    });

    function loadQuestion(idx) {
        nextBtn.style.display = 'none';
        const item = quizItems[idx];

        progressDiv.innerText = `🎧 Soal ke-${idx + 1} dari ${quizItems.length} [Skor: ${score}]`;
        audioStatus.innerText = "Klik tombol di atas untuk mendengarkan.";

        // Event Listener Putar Audio Percakapan (Web Speech Synthesis API)
        playAudioBtn.onclick = () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel(); // Hentikan ucapan sebelumnya
                const utterance = new SpeechSynthesisUtterance(item.transcript);
                utterance.lang = 'en-US';
                utterance.rate = 0.9; // Kecepatan bicara yang nyaman
                
                utterance.onstart = () => { audioStatus.innerText = "🗣️ Sedang memutar percakapan..."; };
                utterance.onend = () => { audioStatus.innerText = "✅ Selesai diputar. Silakan jawab pertanyaan."; };
                
                window.speechSynthesis.speak(utterance);
            } else {
                alert("Browser Anda tidak mendukung Web Speech API.");
            }
        };

        // Render Pilihan Jawaban
        quizBox.innerHTML = `
            <p style="font-size:1.1rem; margin-bottom:15px; font-weight:bold;">${item.question}</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${item.options.map(opt => `<button class="option-btn listen-opt" data-val="${opt}" style="text-align:left; padding:12px; width:100%;">${opt}</button>`).join('')}
            </div>
            <div id="quiz-explanation" style="margin-top:20px;"></div>
        `;

        const optBtns = quizBox.querySelectorAll('.listen-opt');
        optBtns.forEach(btn => {
            btn.onclick = (e) => {
                optBtns.forEach(b => b.disabled = true);
                const selected = e.target.getAttribute('data-val');
                const explBox = quizBox.querySelector('#quiz-explanation');

                if (selected === item.answer) {
                    score += 10;
                    e.target.style.background = '#e6f4ea';
                    e.target.style.borderColor = '#34a853';
                    explBox.innerHTML = `
                        <div style="border-left:4px solid #34a853; background:#f4faf6; padding:12px; border-radius:6px; color:#137333;">
                            <strong>🎉 Jawaban Benar!</strong><br>${item.explanation}
                        </div>
                    `;
                } else {
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    explBox.innerHTML = `
                        <div style="border-left:4px solid #ea4335; background:#fdf5f5; padding:12px; border-radius:6px; color:#c5221f;">
                            <strong>❌ Kurang Tepat.</strong> Jawaban benar: <strong>${item.answer}</strong><br>${item.explanation}
                        </div>
                    `;
                }

                nextBtn.style.display = 'block';
                if (currentRound >= quizItems.length - 1) {
                    nextBtn.innerText = "📊 Rangkum Skor Akhir Listening";
                } else {
                    nextBtn.innerText = "Soal Selanjutnya ➡️";
                }
            };
        });
    }

    nextBtn.onclick = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        
        currentRound++;
        if (currentRound < quizItems.length) {
            loadQuestion(currentRound);
        } else {
            listeningZone.style.display = 'none';
            resultZone.style.display = 'block';

            const finalScore = score; // Total 10 soal x 10 poin = 100 max
            if (window.updateGlobalScore) {
                window.updateGlobalScore('listening', finalScore);
            }

            resultZone.innerHTML = `
                <div style="font-size:4rem;">🎧</div>
                <h3 style="margin:15px 0; color:var(--primary-color);">Sesi Evaluasi Listening Selesai!</h3>
                <p style="font-size:1.2rem; margin-bottom:10px;">Tema Fokus: <strong>${currentThemeLabel}</strong></p>
                <div class="score-badge" style="display:inline-block; font-size:1.5rem; padding:10px 30px; margin-bottom:25px; background:var(--primary-color); color:#fff; border-radius:30px;">
                    Nilai Anda: ${finalScore} / 100
                </div>
                <button id="btn-restart-listening" class="action-btn" style="width:100%; max-width:400px;">🔄 Ganti Tema Pilihan Baru</button>
            `;

            container.querySelector('#btn-restart-listening').onclick = () => {
                resultZone.style.display = 'none';
                themeSelector.style.display = 'flex';
            };
        }
    };
}
