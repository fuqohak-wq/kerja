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
    let sessionData = null; // Menyimpan data artikel aktif

    // Menyisipkan gaya khusus untuk memposisikan penunjuk kamus (tooltip) secara dinamis
    const styleId = 'reading-custom-tooltip-styles';
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
            .reading-container {
                position: relative; /* Wadah utama harus relatif agar posisi popup absolut bekerja dengan benar */
            }
            #dict-popup {
                position: absolute;
                background: #2ec4b6 !important;
                color: #ffffff !important;
                padding: 6px 14px !important;
                border-radius: 6px !important;
                font-size: 0.9rem !important;
                font-weight: 500 !important;
                z-index: 1000 !important;
                box-shadow: 0 4px 10px rgba(0,0,0,0.15) !important;
                display: none;
                transform: translate(-50%, -100%);
                margin-top: -10px;
                white-space: nowrap;
                pointer-events: none;
                transition: left 0.15s ease, top 0.15s ease;
                border-left: none !important;
            }
            #dict-popup::after {
                content: "";
                position: absolute;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 6px 6px 0;
                border-style: solid;
                border-color: #2ec4b6 transparent;
                display: block;
                width: 0;
            }
            .reading-clickable-word {
                display: inline-block;
                border-radius: 4px;
                padding: 0 2px;
                transition: background-color 0.2s, color 0.2s;
            }
            .reading-clickable-word.active-vocab-highlight {
                background-color: #2ec4b6 !important;
                color: #ffffff !important;
            }
        `;
        document.head.appendChild(styleEl);
    }

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
                <div id="dict-popup"></div>

                <div id="text-article-box" style="background:#fff; border:1px solid #dadce0; padding:25px; border-radius:12px; text-align:left; line-height:1.8; font-size:1.1rem; margin-bottom:25px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position:relative;"></div>

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
                body: JSON.stringify({ 
                    theme: currentTheme || '',
                    timestamp: Date.now()
                })
            });

            if (!res.ok) throw new Error("Gagal mengambil data reading");
            
            let rawText = await res.text();
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            
            const firstOpen = rawText.indexOf('{');
            const lastClose = rawText.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                rawText = rawText.substring(firstOpen, lastClose + 1);
            }
            
            const data = JSON.parse(rawText);
            sessionData = data; // Simpan ke level scope agar bisa diakses fungsi global
            
            loadingDiv.style.display = 'none';
            readingZone.style.display = 'block';

            renderInteractiveText(data);
            setupQuiz(data);

        } catch (err) {
            console.error("Error Reading Session:", err);
            loadingDiv.style.display = 'none';
            quizArticleBox.innerHTML = `
                <p style="color:red; text-align:center;">Gagal menyusun modul reading. Mari kita coba buat ulang.</p>
                <button id="btn-retry-reading" class="action-btn" style="margin:10px auto; display:block;">🔄 Muat Ulang</button>
            `;
            container.querySelector('#btn-retry-reading').onclick = loadReadingSession;
        }
    }

    // Fungsi pembantu untuk memposisikan tooltip dinamis di atas koordinat target
    function showTooltipAt(rect, translationText) {
        dictPopup.innerHTML = translationText;
        dictPopup.style.display = 'block';

        const containerEl = container.querySelector('.reading-container');
        const containerRect = containerEl.getBoundingClientRect();
        
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Posisi tengah horizontal elemen target relatif terhadap container utama
        const targetCenterX = (rect.left - containerRect.left) + (rect.width / 2);
        // Posisi atas elemen target relatif terhadap container utama
        const targetTopY = rect.top - containerRect.top;

        dictPopup.style.left = `${targetCenterX}px`;
        dictPopup.style.top = `${targetTopY}px`;
    }

    function renderInteractiveText(data) {
        const paragraphs = [data.paragraph1, data.paragraph2, data.paragraph3];
        
        const htmlContent = paragraphs.map(para => {
            if (!para) return "";
            const words = para.split(/\s+/);
            const wrappedWords = words.map((word, idx) => {
                const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g,"").toLowerCase();
                return `<span class="reading-clickable-word" data-clean="${cleanWord}" style="cursor:pointer;">${word}</span>`;
            }).join(' ');
            return `<p style="margin-bottom:15px; text-align:justify;">${wrappedWords}</p>`;
        }).join('');

        textArticleBox.innerHTML = htmlContent;

        const wordSpans = textArticleBox.querySelectorAll('.reading-clickable-word');
        wordSpans.forEach(span => {
            span.addEventListener('mouseover', (e) => { 
                if (!e.target.classList.contains('active-vocab-highlight')) {
                    e.target.style.background = '#e8f0fe'; 
                }
            });
            span.addEventListener('mouseout', (e) => { 
                if (!e.target.classList.contains('active-vocab-highlight')) {
                    e.target.style.background = 'transparent'; 
                }
            });
            
            span.addEventListener('click', (e) => {
                e.stopPropagation(); // Cegah hilangnya highlight akibat event click global
                
                // Reset highlight kata sebelumnya
                wordSpans.forEach(w => {
                    w.classList.remove('active-vocab-highlight');
                    w.style.background = 'transparent';
                });

                const targetWord = e.target.getAttribute('data-clean');
                let translation = "Arti tidak ditemukan dalam mini-dict.";
                
                if (data.vocabularyMap) {
                    const keys = Object.keys(data.vocabularyMap);
                    const matchedKey = keys.find(k => targetWord.includes(k.toLowerCase()) || k.toLowerCase().includes(targetWord));
                    if (matchedKey) {
                        translation = data.vocabularyMap[matchedKey];
                    }
                }
                
                // Tambahkan kelas highlight aktif pada kata yang diklik
                e.target.classList.add('active-vocab-highlight');
                
                // Ambil koordinat posisi kata yang diklik
                const rect = e.target.getBoundingClientRect();
                showTooltipAt(rect, translation);
            });
        });
    }

    // Penanganan pendeteksian seleksi kata/kalimat (drag-highlight manual oleh pengguna)
    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim().toLowerCase();
        
        if (selectedText.length > 0 && textArticleBox.contains(selection.anchorNode)) {
            if (sessionData && sessionData.vocabularyMap) {
                const keys = Object.keys(sessionData.vocabularyMap);
                const matchedKey = keys.find(k => {
                    const cleanKey = k.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g,"").toLowerCase();
                    return cleanKey === selectedText || selectedText.includes(cleanKey);
                });
                
                if (matchedKey) {
                    const translation = sessionData.vocabularyMap[matchedKey];
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    
                    showTooltipAt(rect, translation);
                }
            }
        }
    });

    // Menutup popup terjemahan dan menghapus highlight saat mengklik di luar area teks
    document.addEventListener('click', (e) => {
        if (!textArticleBox.contains(e.target) && e.target !== dictPopup) {
            dictPopup.style.display = 'none';
            const wordSpans = textArticleBox.querySelectorAll('.reading-clickable-word');
            wordSpans.forEach(w => {
                w.classList.remove('active-vocab-highlight');
                w.style.background = 'transparent';
            });
        }
    });

    function setupQuiz(data) {
        quizArticleBox.innerHTML = `
            <p style="font-size:1.1rem; margin-bottom:15px; font-weight:bold;">Pertanyaan Kuis:<br>${data.question}</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${(data.options || []).map(opt => `<button class="option-btn read-opt" data-val="${opt}" style="text-align:left; padding:12px; width:100%;">${opt}</button>`).join('')}
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
            
            const finalScore = Math.round((score / maxRounds) * 100);
            
            if (window.updateGlobalScore) {
                window.updateGlobalScore('reading', finalScore);
            }
            
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
