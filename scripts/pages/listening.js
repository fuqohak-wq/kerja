export function renderListening(container) {
    // Tema Asli Dipertahankan 100% + Ditambah Tema-Tema Keislaman & Akademik Baru
    const themes = [
        // --- TEMA ASLI PANJENENGAN (DIPERTAHANKAN) ---
        { id: 'daily', label: '💬 Percakapan Sehari-hari' },
        { id: 'travel', label: '✈️ Bandara & Perjalanan' },
        { id: 'kitab', label: '📜 Nahwu & Shorof' },
        { id: 'fikih', label: '⚖️ Ilmu Fikih & Hukum Islam' },
        { id: 'quran', label: '📖 Al-Quran & Hadis' },
        { id: 'office', label: '💼 Dunia Kerja & Kantor' },
        { id: 'shopping', label: '🛍️ Belanja & Restoran' },
        { id: 'academic', label: '🎓 Perkuliahan & Pendidikan' },

        // --- TAMBAHAN TEMA KEISLAMAN & PESANTREN ---
        { id: 'akhlak', label: '🕌 Akhlak, Tasawuf & Adab Santri' },
        { id: 'tarikh', label: '🏛️ Tarikh & Sejarah Peradaban Islam' },
        { id: 'dakwah', label: '🎙️ Retorika Dakwah & Public Speaking' },
        { id: 'pesantren', label: '🏰 Kehidupan & Manajemen Pesantren' },
        { id: 'muamalah', label: '🤝 Ekonomi Syariah & Muamalah' },
        { id: 'tajwid', label: '🎙️ Seni Qira\'ah & Ilmu Tajwid' },

        // --- TAMBAHAN TEMA AKADEMIK & UMUM ---
        { id: 'research', label: '📚 Penulisan Jurnal & Metodologi' },
        { id: 'seminar', label: '🎤 Konferensi & Seminar Internasional' },
        { id: 'health', label: '🩺 Kesehatan & Thibbun Nabawi' },
        { id: 'technology', label: '💻 Sains & Teknologi Digital' }
    ];

    let currentRound = 0;
    let score = 0;
    let quizItems = [];
    let currentThemeLabel = "";

    container.innerHTML = `
        <div class="welcome-section" style="text-align:center; margin-bottom:20px;">
            <h2>🎧 AI Listening Academy</h2>
            <p style="color:var(--text-muted, #5f6368);">Pilih tema percakapan atau kajian di bawah ini untuk melatih pendengaran bahasa Inggris Anda.</p>
        </div>

        <div class="listening-container" style="max-width:850px; margin:0 auto; padding:10px;">
            
            <!-- SELEKTOR TEMA GRID RAPI -->
            <div id="theme-selector" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:12px; margin-bottom:25px;">
                ${themes.map(t => `
                    <button class="option-btn theme-btn" data-theme="${t.label}" style="
                        text-align:left; 
                        padding:12px 16px; 
                        border-radius:10px; 
                        border:1px solid #dadce0; 
                        background:#fff; 
                        cursor:pointer; 
                        font-weight:500; 
                        font-size:0.95rem;
                        transition: all 0.2s ease;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    ">
                        ${t.label}
                    </button>
                `).join('')}
            </div>

            <!-- INDIKATOR LOADING -->
            <div id="listening-loading" style="display:none; text-align:center; margin:40px 0; color:var(--primary-color, #1a73e8);">
                <div class="spinner" style="border:4px solid #f3f3f3; border-top:4px solid #1a73e8; border-radius:50%; width:35px; height:35px; animation:spin 1s linear infinite; margin:0 auto 15px auto;"></div>
                <p style="font-weight:bold; margin:0;">⏳ AI sedang menyusun materi audio percakapan baru...</p>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            </div>

            <!-- AREA LATIHAN LISTENING -->
            <div id="listening-zone" style="display:none;">
                <div id="quiz-progress" style="font-weight:bold; color:var(--primary-color, #1a73e8); margin-bottom:15px; text-align:center; font-size:1.1rem;"></div>
                
                <!-- KOTAK PEMUTAR AUDIO -->
                <div style="background:#fff; border:1px solid #dadce0; border-radius:12px; padding:25px; text-align:center; margin-bottom:20px; box-shadow:0 2px 5px rgba(0,0,0,0.03);">
                    <button id="btn-play-audio" style="background:#1a73e8; color:white; border:none; padding:14px 28px; border-radius:30px; font-weight:bold; cursor:pointer; font-size:1.05rem; box-shadow: 0 2px 6px rgba(26,115,232,0.3);">
                        🔊 Putar Audio Percakapan
                    </button>
                    <p id="audio-status" style="font-size:0.9rem; color:#5f6368; margin-top:10px; margin-bottom:0;">Klik tombol di atas untuk mendengarkan audio.</p>
                </div>

                <!-- KOTAK PERTANYAAN -->
                <div id="quiz-box" style="background:#f8f9fa; border:1px solid #dadce0; padding:20px; border-radius:12px; text-align:left;"></div>

                <button id="btn-next-listening" class="action-btn" style="background:var(--primary-color, #1a73e8); color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; display:none; margin:20px auto 0 auto; width:100%; max-width:400px; cursor:pointer;">Soal Selanjutnya ➡️</button>
            </div>

            <!-- HASIL AKHIR EVALUASI -->
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
        btn.addEventListener('mouseover', (e) => {
            e.target.style.borderColor = '#1a73e8';
            e.target.style.background = '#e8f0fe';
        });
        btn.addEventListener('mouseout', (e) => {
            e.target.style.borderColor = '#dadce0';
            e.target.style.background = '#fff';
        });

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

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Gagal menghubungi server AI.");
                }

                quizItems = data.items || [];
                if (quizItems.length === 0) throw new Error("Format materi dari AI tidak sesuai.");

                currentRound = 0;
                score = 0;
                loadingDiv.style.display = 'none';
                listeningZone.style.display = 'block';

                loadQuestion(currentRound);

            } catch (err) {
                console.error("Listening Error:", err);
                loadingDiv.style.display = 'none';
                
                // POPUP / NOTIFIKASI JUJUR JIKA AI GAGAL
                alert(`⚠️ Layanan AI Gangguan:\n${err.message}\n\nSilakan klik lagi tombol tema untuk mencoba meracik soal baru.`);
                themeSelector.style.display = 'grid';
            }
        });
    });

    function loadQuestion(idx) {
        nextBtn.style.display = 'none';
        const item = quizItems[idx];

        progressDiv.innerText = `🎧 Soal ke-${idx + 1} dari ${quizItems.length} [Skor Sementara: ${score}]`;
        audioStatus.innerText = "Klik tombol di atas untuk mendengarkan audio.";

        playAudioBtn.onclick = () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(item.transcript);
                utterance.lang = 'en-US';
                utterance.rate = 0.88;
                
                utterance.onstart = () => { audioStatus.innerText = "🗣️ AI sedang memutar percakapan..."; };
                utterance.onend = () => { audioStatus.innerText = "✅ Selesai diputar. Silakan pilih jawaban di bawah ini."; };
                
                window.speechSynthesis.speak(utterance);
            } else {
                alert("Browser Anda belum mendukung pemutaran suara otomatis.");
            }
        };

        quizBox.innerHTML = `
            <p style="font-size:1.1rem; margin-bottom:15px; font-weight:bold; color:#202124;">${item.question}</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${item.options.map(opt => `
                    <button class="option-btn listen-opt" data-val="${opt}" style="
                        text-align:left; 
                        padding:12px 15px; 
                        width:100%; 
                        border:1px solid #ccc; 
                        border-radius:8px; 
                        background:#fff; 
                        cursor:pointer; 
                        font-size:0.95rem;
                    ">${opt}</button>
                `).join('')}
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
                        <div style="border-left:4px solid #34a853; background:#f4faf6; padding:14px; border-radius:8px; color:#137333;">
                            <strong>🎉 Masya Allah, Jawaban Benar!</strong><br>${item.explanation}
                        </div>
                    `;
                } else {
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    explBox.innerHTML = `
                        <div style="border-left:4px solid #ea4335; background:#fdf5f5; padding:14px; border-radius:8px; color:#c5221f;">
                            <strong>📌 Jawaban Kurang Tepat.</strong><br>Jawaban yang benar: <strong>${item.answer}</strong><br><small style="margin-top:4px; display:block;">${item.explanation}</small>
                        </div>
                    `;
                }

                nextBtn.style.display = 'block';
                if (currentRound >= quizItems.length - 1) {
                    nextBtn.innerText = "📊 Selesai & Rangkum Skor Akhir";
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

            const finalScore = score;
            if (window.updateGlobalScore) {
                window.updateGlobalScore('listening', finalScore);
            }

            resultZone.innerHTML = `
                <div style="font-size:4rem; margin-bottom:10px;">🎓</div>
                <h3 style="margin:10px 0; color:var(--primary-color, #1a73e8);">Sesi Evaluasi Listening Selesai!</h3>
                <p style="font-size:1.1rem; margin-bottom:15px; color:#5f6368;">Materi Fokus: <strong>${currentThemeLabel}</strong></p>
                <div class="score-badge" style="display:inline-block; font-size:1.6rem; padding:12px 35px; margin-bottom:25px; background:#1a73e8; color:#fff; border-radius:30px; font-weight:bold;">
                    Nilai Anda: ${finalScore} / 100
                </div>
                <br>
                <button id="btn-restart-listening" class="action-btn" style="width:100%; max-width:350px; padding:12px; border-radius:8px; background:#3c4043; color:white; border:none; cursor:pointer; font-weight:bold;">🔄 Pilih Tema Percakapan Lain</button>
            `;

            container.querySelector('#btn-restart-listening').onclick = () => {
                resultZone.style.display = 'none';
                themeSelector.style.display = 'grid';
            };
        }
    };
}
