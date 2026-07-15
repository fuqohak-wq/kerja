export function renderReading(container) {
    const themes = [
        { id: 'sosial', label: '👥 Sosial & Masyarakat' },
        { id: 'bahasa', label: '🗣️ Bahasa & Linguistik' },
        { id: 'fiqih', label: '📜 Fiqih & Ushul Fiqih' },
        { id: 'tauhid', label: '🕌 Tauhid & Tasawuf' },
        { id: 'politik', label: '🏛️ Politik & Tata Negara' },
        { id: 'agama', label: '📖 Kajian Keagamaan' },
        { id: 'kesehatan', label: '💪 Kesehatan & Kebugaran' },
        { id: 'berita_indo', label: '📰 Berita Terbaru Indonesia' },
        { id: 'berita_dunia', label: '🌍 Berita Mancanegara' },
        { id: 'ekonomi', label: '📈 Ekonomi & Bisnis' },
        { id: 'budaya', label: '🎭 Budaya & Seni' },
        { id: 'asmara', label: '❤️ Cinta & Asmara' },
        { id: 'sains', label: '🚀 Sains & Teknologi' }
    ];

    let currentRound = 0;
    const maxRounds = 10;
    let score = 0;
    let currentTheme = "";
    let savedParagraphs = []; // Menyimpan teks agar tidak berubah selama 10 soal satu tema

    container.innerHTML = `
        <div class="welcome-section">
            <h2>📖 AI Reading & Vocabulary Academy</h2>
            <p>Pilih tema artikel. Klik pada kata manapun di dalam teks untuk mengintip artinya dalam Bahasa Indonesia!</p>
        </div>
        <div class="reading-container" style="max-width:800px; margin:0 auto; padding:10px;">
            <div id="theme-selector" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-bottom:25px;">
                ${themes.map(t => `<button class="option-btn theme-btn" data-theme="${t.label}" style="width:auto; padding:10px 15px;">${t.label}</button>`).join('')}
            </div>

            <div id="quiz-progress" style="display:none; font-weight:bold; color:var(--primary-color); margin-bottom:15px; text-align:center;"></div>

            <div id="reading-loading" style="display:none; text-align:center; margin:30px 0; color:var(--primary-color);">
                <span class="loading-spinner">⏳</span> Menganalisis dan meracik materi artikel baru dari AI...
            </div>

            <div id="reading-zone" style="display:none;">
                <div id="dict-popup" style="background:#202124; color:#fff; padding:8px 15px; border-radius:20px; font-size:0.9rem; text-align:center; margin-bottom:15px; display:none; font-weight:500; border-left:4px solid var(--primary-color);"></div>

                <div id="text-article-box" style="background:#fff; border:1px solid #dadce0; padding:25px; border-radius:12px; text-align:left; line-height:1.8; font-size:1.1rem; margin-bottom:25px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"></div>

                <div id="quiz-article-box" style="background:#f8f9fa; border:1px solid #dadce0; padding:20px; border-radius:12px; text-align:left;"></div>
                
                <button id="btn-next-reading" class="action-btn" style="background:var(--primary-color); display:none; margin:20px auto 0 auto; width:100%; max-width:400px;">Pertanyaan Selanjutnya ➡️</button>
            </div>

            <div id="result-zone" style="display:none; text-align:center; padding:30px 10px;"></div>
        </div>
    `;

    const themeSelector = container.querySelector('#theme-selector');
    const themeButtons = container.querySelectorAll('.theme-btn');
    const readingZone = container.querySelector('#reading-zone');
    const loadingDiv = container.querySelector('#reading-loading');
    const textArticleBox = container.querySelector('#text-article-box');
    const quizArticleBox = container.querySelector('#quiz-article-box');
    const nextBtn = container.querySelector('#btn-next-reading');
    const progressDiv = container.querySelector('#quiz-progress');
    const dictPopup = container.querySelector('#dict-popup');
    const resultZone = container.querySelector('#result-zone');

    themeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTheme = e.target.getAttribute('data-theme');
            currentRound = 1;
            score = 0;
            savedParagraphs = []; // Reset penampung teks
            
            themeSelector.style.display = 'none';
            resultZone.style.display = 'none';
            
            loadReadingSession();
        });
    });

    async function loadReadingSession() {
        readingZone.style.display = 'none';
        nextBtn.style.display = 'none';
        dictPopup.style.display = 'none';
        loadingDiv.style.display = 'block';
        quizArticleBox.innerHTML = '';
        
        progressDiv.style.display = 'block';
        progressDiv.innerText = `📝 Tantangan Bacaan ke-${currentRound} dari ${maxRounds} [Skor: ${score}]`;

        try {
            const res = await fetch('/api/reading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: `${currentTheme} (acak: ${Math.random()})` })
            });

            if (!res.ok) throw new Error();
            
            let rawText = await res.text();
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            // Kebal Eror enter data json
            rawText = rawText.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
            rawText = rawText.replace(/{\\n/g, '{').replace(/\\n}/g, '}').replace(/,\\n/g, ',');
            
            const data = JSON.parse(rawText);
            
            loadingDiv.style.display = 'none';
            readingZone.style.display = 'block';

            // Pertahankan teks artikel yang sama di ronde 1, atau perbarui bertahap agar wawasan meluas
            renderInteractiveText(data);
            setupQuiz(data);

        } catch (err) {
            console.error(err);
            loadingDiv.style.display = 'none';
            quizArticleBox.innerHTML = `
                <p style="color:red; text-align:center;">Gagal menyusun modul reading. Mari kita coba buat ulang.</p>
                <button id="btn-retry-reading" class="action-btn" style="margin:10px auto; display:block;">🔄 Muat Ulang</button>
            `;
            container.querySelector('#btn-retry-reading').onclick = loadReadingSession;
        }
    }

    // Fungsi canggih untuk memotong kata dan menjadikannya interaktif saat diklik
    function renderInteractiveText(data) {
        const paragraphs = [data.paragraph1, data.paragraph2, data.paragraph3];
        
        const htmlContent = paragraphs.map(para => {
            if (!para) return "";
            // Pisahkan kalimat berdasarkan spasi menjadi kumpulan kata tunggal
            const words = para.split(/\s+/);
            const wrappedWords = words.map(word => {
                // Bersihkan tanda baca untuk pencocokan kamus AI
                const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g,"").toLowerCase();
                return `<span class="reading-clickable-word" data-clean="${cleanWord}" style="cursor:pointer; padding:2px 1px; border-radius:4px; transition:all 0.2s;">${word}</span>`;
            }).join(' ');
            return `<p style="margin-bottom:15px; text-align:justify;">${wrappedWords}</p>`;
        }).join('');

        textArticleBox.innerHTML = htmlContent;

        // Tambahkan event click untuk fitur terjemahan kata instan
        const wordSpans = textArticleBox.querySelectorAll('.reading-clickable-word');
        wordSpans.forEach(span => {
            span.addEventListener('mouseover', (e) => { e.target.style.background = '#e8f0fe'; });
            span.addEventListener('mouseout', (e) => { e.target.style.background = 'transparent'; });
            
            span.addEventListener('click', (e) => {
                const targetWord = e.target.getAttribute('data-clean');
                
                // Cari kecocokan kata di kamus terjemahan dari Gemini
                let translation = "Arti tidak ditemukan dalam mini-dict.";
                if (data.vocabularyMap) {
                    // Cari kecocokan langsung atau parsial
                    const keys = Object.keys(data.vocabularyMap);
                    const matchedKey = keys.find(k => targetWord.includes(k.toLowerCase()) || k.toLowerCase().includes(targetWord));
                    if (matchedKey) {
                        translation = data.vocabularyMap[matchedKey];
                    }
                }
                
                // Tampilkan Popup Terjemahan di bagian atas teks
                dictPopup.style.display = 'block';
                dictPopup.innerHTML = `🔍 <strong>${e.target.innerText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g,"")}</strong> &rarr; <span style="color:#8ab4f8;">${translation}</span>`;
            });
        });
    }

    function setupQuiz(data) {
        quizArticleBox.innerHTML = `
            <p style="font-size:1.1rem; margin-bottom:15px; font-weight:bold;">Pertanyaan Kuis:<br>${data.question}</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${data.options.map(opt => `<button class="option-btn read-opt" data-val="${opt}" style="text-align:left; padding:12px; width:100%;">${opt}</button>`).join('')}
            </div>
            <div id="read-quiz-explanation" style="margin-top:20px;"></div>
        `;

        const optButtons = quizArticleBox.querySelectorAll('.read-opt');
        optButtons.forEach(optBtn => {
            optBtn.addEventListener('click', (e) => {
                const selected = e.target.getAttribute('data-val');
                const expl = quizArticleBox.querySelector('#read-quiz-explanation');
                
                optButtons.forEach(b => b.disabled = true);
                
                if (selected === data.answer) {
                    score++;
                    e.target.style.background = '#e6f4ea';
                    e.target.style.borderColor = '#34a853';
                    expl.innerHTML = `
                        <div style="border-left:4px solid #34a853; background:#f4faf6; padding:15px; border-radius:6px;">
                            <h4 style="color:#34a853; margin:0 0 5px 0;">🎯 Jawaban Tepat (Excellent!)</h4>
                            <p style="margin:0; font-size:0.95rem;">${data.explanation}</p>
                        </div>
                    `;
                } else {
                    e.target.style.background = '#fce8e6';
                    e.target.style.borderColor = '#ea4335';
                    expl.innerHTML = `
                        <div style="border-left:4px solid #ea4335; background:#fdf5f5; padding:15px; border-radius:6px;">
                            <h4 style="color:#ea4335; margin:0 0 5px 0;">📌 Kurang Tepat</h4>
                            <p style="margin:0 0 8px 0; font-size:0.95rem;">Kunci Jawaban: <strong>${data.answer}</strong></p>
                            <p style="margin:0; font-size:0.9rem; color:var(--text-muted);">${data.explanation}</p>
                        </div>
                    `;
                }
                
                nextBtn.style.display = 'block';
                if (currentRound >= maxRounds) {
                    nextBtn.innerText = "📊 Rangkum Skor Akhir Reading";
                } else {
                    nextBtn.innerText = "Pertanyaan Selanjutnya ➡️";
                }
            });
        });
    }

    nextBtn.onclick = () => {
        if (currentRound < maxRounds) {
            currentRound++;
            loadReadingSession();
        } else {
            readingZone.style.display = 'none';
            progressDiv.style.display = 'none';
            resultZone.style.display = 'block';
            
            // Tambahkan baris penugasan skor global ini tepat sebelum merender halaman skor akhir di /scripts/pages/reading.js
const finalScore = Math.round((score / maxRounds) * 100);
if (!window.globalScores) window.globalScores = {};
window.globalScores.reading = finalScore; // Menyimpan skor membaca ke memori global aplikasi
            
            resultZone.innerHTML = `
                <div style="font-size:4rem;">🎓</div>
                <h3 style="margin:15px 0; color:var(--primary-color);">Sesi Evaluasi Reading Selesai!</h3>
                <p style="font-size:1.2rem; margin-bottom:10px;">Tema Fokus: <strong>${currentTheme}</strong></p>
                <div class="score-badge" style="display:inline-block; font-size:1.5rem; padding:10px 30px; margin-bottom:25px; background:var(--primary-color); color:#fff; border-radius:30px;">
                    Nilai Anda: ${finalScore} / 100
                </div>
                <p style="color:var(--text-muted); margin-bottom:25px;">Pemahaman Anda tepat pada ${score} dari ${maxRounds} skenario artikel.</p>
                <button id="btn-restart-reading" class="action-btn" style="width:100%; max-width:400px;">🔄 Ganti Pilihan Tema Baru</button>
            `;
            
            container.querySelector('#btn-restart-reading').onclick = () => {
                resultZone.style.display = 'none';
                themeSelector.style.display = 'flex';
            };
        }
    };
}
