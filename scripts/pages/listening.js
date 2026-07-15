export function renderListening(container) {
    // Daftar Tema Sesuai Permintaan Anda
    const themes = [
        { id: 'islamic', label: '🕌 Islamic Studies' },
        { id: 'religion', label: '📖 Kajian Agama' },
        { id: 'religion', label: '📖 Al-Quran dan Hadis' },
        { id: 'religion', label: '📖 Fiqih Tauhid dan Tasawuf' },
        { id: 'religion', label: '📖 Nahwu Sorof dan Bahasa' },
        { id: 'fitness', label: '🏋️ Kebugaran & Kesehatan' },
        { id: 'history', label: '⏳ Sejarah Dunia' },
        { id: 'nature', label: '🌱 Sains & Alam' }
    ];
    
    container.innerHTML = `
        <div class="welcome-section">
            <h2>🎧 AI Listening Practice</h2>
            <p>Pilih tema materi yang ingin kamu dengarkan. AI akan membuatkan soal unik setiap kali kamu mengklik tema.</p>
        </div>
        <div class="reading-container" style="text-align:center;">
            <div style="margin-bottom: 25px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                ${themes.map(t => `<button class="option-btn theme-btn" data-theme="${t.label}" style="display:inline-block; width:auto; padding: 10px 15px; font-weight: 500;">${t.label}</button>`).join('')}
            </div>
            
            <div id="listening-loading" style="display:none; margin: 20px 0; color: var(--primary-color);">
                <span class="loading-spinner">⏳</span> Meracik teks listening dan soal AI baru untukmu...
            </div>

            <div id="listening-zone" style="display:none;">
                <button id="btn-play-audio" class="action-btn" style="background:#34a853; margin-bottom:15px; width: 100%; max-width: 400px;">🔊 Putar Suara Audio</button>
                <div id="quiz-zone" style="margin-top:20px; text-align:left;"></div>
            </div>
        </div>
    `;

    const themeButtons = container.querySelectorAll('.theme-btn');
    const listeningZone = container.querySelector('#listening-zone');
    const loadingDiv = container.querySelector('#listening-loading');
    const quizZone = container.querySelector('#quiz-zone');
    const playBtn = container.querySelector('#btn-play-audio');

    let currentQuizData = null;

    themeButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const selectedTheme = e.target.getAttribute('data-theme');
            
            // Atur UI Loading
            listeningZone.style.display = 'none';
            loadingDiv.style.display = 'block';
            quizZone.innerHTML = '';
            window.speechSynthesis.cancel();

            try {
                const res = await fetch('/api/listening', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme: selectedTheme })
                });
                
                if (!res.ok) throw new Error("Gagal mengambil data kuis.");
                
                currentQuizData = await res.json();
                loadingDiv.style.display = 'none';
                listeningZone.style.display = 'block';
                
                setupListeningQuiz(currentQuizData);
            } catch (err) {
                loadingDiv.style.display = 'none';
                alert("Waduh, koneksi AI sibuk. Silakan coba klik temanya sekali lagi!");
                console.error(err);
            }
        });
    });

    function setupListeningQuiz(data) {
        // Konfigurasi Tombol Pemutar Audio Suara AI
        playBtn.onclick = () => {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(data.audioText);
            utterance.lang = 'en-US';
            utterance.rate = 0.85; // Sedikit diperlambat agar pas untuk belajar listening
            window.speechSynthesis.speak(utterance);
        };

        // Render Soal dan Opsi Pilihan Ganda secara Dinamis
        quizZone.innerHTML = `
            <p class="question-title" style="font-size: 1.1rem; margin-bottom: 15px;"><strong>Pertanyaan (Dengarkan Audio Dahulu):</strong><br>${data.question}</p>
            <div class="options-list" style="display: flex; flex-direction: column; gap: 10px;">
                ${data.options.map(opt => `<button class="option-btn listen-opt" data-val="${opt}" style="text-align: left; padding: 12px; width: 100%;">${opt}</button>`).join('')}
            </div>
            <div id="listen-explanation" style="margin-top: 20px;"></div>
        `;

        // Logika Pengecekan Jawaban Benar / Salah
        const optButtons = quizZone.querySelectorAll('.listen-opt');
        optButtons.forEach(optBtn => {
            optBtn.addEventListener('click', (e) => {
                const selected = e.target.getAttribute('data-val');
                const expl = quizZone.querySelector('#listen-explanation');
                
                // Kunci semua tombol agar tidak bisa diubah-ubah jawabannya
                optButtons.forEach(b => b.disabled = true);
                
                if (selected === data.answer) {
                    e.target.style.background = '#e6f4ea';
                    e.target.style.borderColor = '#34a853';
                    expl.innerHTML = `
                        <div class="explanation-box" style="border-left: 4px solid #34a853; background: #f4faf6; padding: 15px; border-radius: 6px;">
                            <h4 style="color:#34a853; margin: 0 0 5px 0;">✅ Benar Sekali!</h4>
                            <p style="margin:0; font-size:0.95rem;">${data.explanation}</p>
                        </div>
                    `;
                } else {
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    expl.innerHTML = `
                        <div class="explanation-box" style="border-left: 4px solid #ea4335; background: #fdf5f5; padding: 15px; border-radius: 6px;">
                            <h4 style="color:#ea4335; margin: 0 0 5px 0;">❌ Kurang Tepat</h4>
                            <p style="margin:0 0 8px 0; font-size:0.95rem;">Jawaban yang betul: <strong>${data.answer}</strong></p>
                            <p style="margin:0; font-size:0.9rem; color: var(--text-muted);"><small>Analisis: ${data.explanation}</small></p>
                        </div>
                    `;
                }
            });
        });
    }
}
