export function renderListening(container) {
    const themes = [
        { id: 'islamic', label: '🕌 Islamic Studies' },
        { id: 'religion_kajian', label: '📖 Kajian Agama' },
        { id: 'religion_quran', label: '📖 Al-Quran dan Hadis' },
        { id: 'religion_fiqih', label: '📖 Fiqih Tauhid dan Tasawuf' },
        { id: 'religion_nahwu', label: '📖 Nahwu Sorof dan Bahasa' },
        { id: 'fitness', label: '🏋️ Kebugaran & Kesehatan' },
        { id: 'history', label: '⏳ Sejarah Dunia' },
        { id: 'nature', label: '🌱 Sains & Alam' }
    ];
     
    let currentRound = 0;
    const maxRounds = 10;
    let score = 0;
    let currentTheme = "";

    container.innerHTML = `
        <div class="welcome-section">
            <h2>🎧 AI Listening Practice (10 Soal Berkelanjutan)</h2>
            <p>Pilih tema. AI akan meracik 10 pertanyaan unik secara estafet agar latihanmu makin mantap!</p>
        </div>
        <div class="reading-container" style="text-align:center;">
            <div id="theme-selector" style="margin-bottom: 25px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                ${themes.map(t => `<button class="option-btn theme-btn" data-theme="${t.label}" style="display:inline-block; width:auto; padding: 10px 15px; font-weight: 500;">${t.label}</button>`).join('')}
            </div>
            
            <div id="quiz-progress" style="display:none; margin-bottom: 20px; font-weight: bold; color: var(--primary-color);"></div>

            <div id="listening-loading" style="display:none; margin: 20px 0; color: var(--primary-color);">
                <span class="loading-spinner">⏳</span> <span id="loading-text">Meracik soal baru dari AI...</span>
            </div>

            <div id="listening-zone" style="display:none;">
                <button id="btn-play-audio" class="action-btn" style="background:#34a853; margin-bottom:15px; width: 100%; max-width: 400px;">🔊 Putar Suara Audio</button>
                <div id="quiz-zone" style="margin-top:20px; text-align:left;"></div>
                <button id="btn-next-round" class="action-btn" style="background:var(--primary-color); display:none; margin-top:20px; width:100%; max-width:400px;">Pertanyaan Selanjutnya ➡️</button>
            </div>

            <div id="result-zone" style="display:none; padding: 30px 10px;"></div>
        </div>
    `;

    const themeSelector = container.querySelector('#theme-selector');
    const themeButtons = container.querySelectorAll('.theme-btn');
    const listeningZone = container.querySelector('#listening-zone');
    const loadingDiv = container.querySelector('#listening-loading');
    const quizZone = container.querySelector('#quiz-zone');
    const playBtn = container.querySelector('#btn-play-audio');
    const nextBtn = container.querySelector('#btn-next-round');
    const progressDiv = container.querySelector('#quiz-progress');
    const resultZone = container.querySelector('#result-zone');

    themeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTheme = e.target.getAttribute('data-theme');
            currentRound = 1;
            score = 0;
            
            themeSelector.style.display = 'none';
            progressDiv.style.display = 'block';
            resultZone.style.display = 'none';
            
            loadNewQuestion();
        });
    });

    async function loadNewQuestion() {
        listeningZone.style.display = 'none';
        nextBtn.style.display = 'none';
        loadingDiv.style.display = 'block';
        quizZone.innerHTML = '';
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        progressDiv.style.display = 'block';
        progressDiv.innerText = `📝 Pertanyaan ke-${currentRound} dari ${maxRounds} [Benar: ${score}]`;

        try {
            const res = await fetch('/api/listening', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: `${currentTheme} (soal kode acak: ${Math.random()})` }) 
            });
            
            if (!res.ok) throw new Error("Respons jaringan bermasalah.");
            
            let rawText = await res.text();
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            rawText = rawText.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
            rawText = rawText.replace(/{\\n/g, '{').replace(/\\n}/g, '}').replace(/,\\n/g, ',');
            
            const data = JSON.parse(rawText);
            
            loadingDiv.style.display = 'none';
            listeningZone.style.display = 'block';
            
            setupListeningQuiz(data);
        } catch (err) {
            console.error("Detail Error Parsing:", err);
            loadingDiv.style.display = 'none';
            quizZone.innerHTML = `
                <p style="color:#ea4335; text-align:center; font-weight:500;">⚠️ Gagal memproses data dari AI.</p>
                <button id="btn-retry-round" class="action-btn" style="margin:15px auto; display:block; background:#f4b400;">🔄 Coba Muat Ulang Soal</button>
            `;
            container.querySelector('#btn-retry-round').onclick = loadNewQuestion;
        }
    }

    function setupListeningQuiz(data) {
        const cleanAudioText = (data.audioText || "").replace(/\\n/g, ' ').replace(/\\r/g, ' ');
        const cleanQuestion = (data.question || "").replace(/\\n/g, '<br>').replace(/\\r/g, '');
        const cleanExplanation = (data.explanation || "").replace(/\\n/g, '<br>').replace(/\\r/g, '');

        playBtn.onclick = () => {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(cleanAudioText);
            utterance.lang = 'en-US';
            utterance.rate = 0.85; 
            window.speechSynthesis.speak(utterance);
        };

        quizZone.innerHTML = `
            <p class="question-title" style="font-size: 1.1rem; margin-bottom: 15px;"><strong>Pertanyaan:</strong><br>${cleanQuestion}</p>
            <div class="options-list" style="display: flex; flex-direction: column; gap: 10px;">
                ${(data.options || []).map(opt => {
                    const cleanOpt = opt.replace(/\\n/g, ' ').replace(/\\r/g, '');
                    return `<button class="option-btn listen-opt" data-val="${cleanOpt}" style="text-align: left; padding: 12px; width: 100%;">${cleanOpt}</button>`;
                }).join('')}
            </div>
            <div id="listen-explanation" style="margin-top: 20px;"></div>
        `;

        const optButtons = quizZone.querySelectorAll('.listen-opt');
        optButtons.forEach(optBtn => {
            optBtn.addEventListener('click', (e) => {
                const selected = e.target.getAttribute('data-val');
                const expl = quizZone.querySelector('#listen-explanation');
                
                optButtons.forEach(b => b.disabled = true);
                const cleanCorrectAnswer = (data.answer || "").replace(/\\n/g, ' ').replace(/\\r/g, '').trim();
                
                if (selected.trim() === cleanCorrectAnswer) {
                    score++;
                    e.target.style.background = '#e6f4ea';
                    e.target.style.borderColor = '#34a853';
                    expl.innerHTML = `
                        <div class="explanation-box" style="border-left: 4px solid #34a853; background: #f4faf6; padding: 15px; border-radius: 6px;">
                            <h4 style="color:#34a853; margin: 0 0 5px 0;">✅ Benar!</h4>
                            <p style="margin:0; font-size:0.95rem;">${cleanExplanation}</p>
                        </div>
                    `;
                } else {
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    expl.innerHTML = `
                        <div class="explanation-box" style="border-left: 4px solid #ea4335; background: #fdf5f5; padding: 15px; border-radius: 6px;">
                            <h4 style="color:#ea4335; margin: 0 0 5px 0;">❌ Kurang Tepat</h4>
                            <p style="margin:0 0 8px 0; font-size:0.95rem;">Jawaban yang betul: <strong>${cleanCorrectAnswer}</strong></p>
                            <p style="margin:0; font-size:0.9rem; color: var(--text-muted);">${cleanExplanation}</p>
                        </div>
                    `;
                }
                
                nextBtn.style.display = 'block';
                if(currentRound >= maxRounds) {
                    nextBtn.innerText = "📊 Lihat Hasil Akhir Kuis";
                } else {
                    nextBtn.innerText = "Pertanyaan Selanjutnya ➡️";
                }
            });
        });
    }

    nextBtn.onclick = () => {
        if (currentRound < maxRounds) {
            currentRound++;
            loadNewQuestion();
        } else {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            listeningZone.style.display = 'none';
            progressDiv.style.display = 'none';
            resultZone.style.display = 'block';
            
            const finalScore = Math.round((score / maxRounds) * 100);

            // SIMPAN SKOR LISTENING KE SISTEM SKOR GLOBAL
            if (window.updateGlobalScore) {
                window.updateGlobalScore('listening', finalScore);
            }
            
            resultZone.innerHTML = `
                <div style="font-size: 4rem;">🏆</div>
                <h3 style="margin: 15px 0; color: var(--primary-color);">Sesi Latihan Listening Selesai!</h3>
                <p style="font-size: 1.2rem; margin-bottom: 10px;">Tema: <strong>${currentTheme}</strong></p>
                <div class="score-badge" style="display:inline-block; font-size:1.5rem; padding: 10px 30px; margin-bottom: 25px;">
                    Skor Listening: ${finalScore} / 100
                </div>
                <p style="color: var(--text-muted); margin-bottom: 25px;">Anda menjawab benar ${score} dari ${maxRounds} soal.</p>
                <button id="btn-restart-listening" class="action-btn" style="width:100%; max-width:400px;">🔄 Pilih Tema Lain</button>
            `;
            
            container.querySelector('#btn-restart-listening').onclick = () => {
                resultZone.style.display = 'none';
                themeSelector.style.display = 'flex';
            };
        }
    };
}
