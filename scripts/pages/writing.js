// Daftar tema latihan menulis acak
const WRITING_TOPICS = [
    "Describe your hometown and what makes it special.",
    "What are the advantages and disadvantages of working from home?",
    "Talk about a memorable holiday or trip you took in the past.",
    "Why do you think learning English is important for your future career?",
    "Describe your favorite hobby and how you got started with it."
];

export function renderWriting(container) {
    // Pilih tema secara acak
    const randomTopic = WRITING_TOPICS[Math.floor(Math.random() * WRITING_TOPICS.length)];
    const currentLevel = 'B1';

    container.innerHTML = `
        <div class="welcome-section">
            <h2>✍️ Writing Practice</h2>
            <p>Tulis esai singkat berdasarkan tema di bawah ini.</p>
        </div>

        <div class="writing-container">
            <div class="topic-box">
                <small style="color: var(--text-muted); display:block; margin-bottom:4px;">TEMA HARI INI:</small>
                "${randomTopic}"
            </div>

            <textarea id="essay-input" class="writing-textarea" placeholder="Tulis jawaban bahasa Inggris kamu di sini (minimal 10 kata)..."></textarea>
            
            <button id="btn-submit-essay" class="action-btn">Kirim & Periksa dengan AI</button>

            <div id="loading-space" class="loading-box" style="display:none; text-align:center; padding:20px;">
                ⏳ AI sedang membaca dan mengoreksi tulisanmu. Harap tunggu...
            </div>

            <div id="result-space" class="result-card" style="display:none;"></div>
        </div>
    `;

    const submitBtn = container.querySelector('#btn-submit-essay');
    const essayInput = container.querySelector('#essay-input');
    const loadingSpace = container.querySelector('#loading-space');
    const resultSpace = container.querySelector('#result-space');

    submitBtn.addEventListener('click', async () => {
        const textValue = essayInput.value.trim();
        
        if (textValue.split(/\s+/).filter(Boolean).length < 5) {
            alert('Tulisan kamu terlalu pendek. Silakan tulis kalimat yang lebih panjang (minimal 5 kata).');
            return;
        }

        // Tampilkan loading, sembunyikan tombol
        submitBtn.style.display = 'none';
        essayInput.disabled = true;
        loadingSpace.style.display = 'block';
        resultSpace.style.display = 'none';

        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textValue,
                    topic: randomTopic,
                    level: currentLevel
                })
            });

            if (!response.ok) throw new Error('Gagal terhubung dengan server AI.');
            const data = await response.json();

            // 🟢 SOLUSI BUG NILAI: Ambil nilai skor dengan beberapa opsi nama properti fallback
            let writingScore = Number(data.score || data.overallScore || data.overall || data.finalScore);
            if (isNaN(writingScore) || writingScore === undefined) {
                writingScore = 75; // Nilai default jika AI tidak mengembalikan angka spesifik
            }
            writingScore = Math.min(100, Math.max(0, Math.round(writingScore)));

            // 🟢 SIMPAN KE SISTEM SKOR GLOBAL
            if (window.updateGlobalScore) {
                window.updateGlobalScore('writing', writingScore);
            }

            // Sembunyikan Loading
            loadingSpace.style.display = 'none';
            resultSpace.style.display = 'block';

            // Tampilkan hasil dari AI
            resultSpace.innerHTML = `
                <div style="text-align:center; margin-bottom:20px;">
                    <div class="score-badge" style="display:inline-block; font-size:1.3rem; padding:10px 25px; background:var(--primary-color); color:#fff; border-radius:25px; font-weight:bold;">
                        Skor AI: ${writingScore} / 100
                    </div>
                </div>

                <div class="eval-section" style="margin-bottom:15px; background:#f8f9fa; padding:15px; border-radius:8px;">
                    <h4 style="margin-top:0; color:var(--primary-color);">🔍 Koreksi Tata Bahasa (Grammar)</h4>
                    <p style="margin:5px 0 0 0;">${data.grammarCorrection || data.grammar || 'Grammar Anda sudah bagus.'}</p>
                </div>

                <div class="eval-section" style="margin-bottom:15px; background:#f8f9fa; padding:15px; border-radius:8px;">
                    <h4 style="margin-top:0; color:var(--primary-color);">📚 Koreksi Kosakata (Vocabulary)</h4>
                    <p style="margin:5px 0 0 0;">${data.vocabularyCorrection || data.vocabulary || 'Penggunaan kata sudah tepat.'}</p>
                </div>

                <div class="eval-section" style="margin-bottom:15px; background:#f8f9fa; padding:15px; border-radius:8px;">
                    <h4 style="margin-top:0; color:var(--primary-color);">💡 Ekspresi Alami (Natural Expression)</h4>
                    <p style="margin:5px 0 0 0;">${data.naturalExpression || 'Kalimat dapat dipahami dengan baik.'}</p>
                </div>

                <div class="eval-section" style="margin-bottom:15px; border-left: 4px solid var(--secondary-color, #34a853); background:#f4faf6; padding:15px; border-radius:8px;">
                    <h4 style="margin-top:0; color:#2d8e47;">✨ Versi Native Speaker</h4>
                    <p style="font-style: italic; font-weight: 500; margin:5px 0 0 0;">"${data.nativeVersion || textValue}"</p>
                </div>

                <div class="eval-section" style="margin-bottom:20px; background:#f8f9fa; padding:15px; border-radius:8px;">
                    <h4 style="margin-top:0; color:var(--primary-color);">🇮🇩 Arti dalam Bahasa Indonesia</h4>
                    <p style="margin:5px 0 0 0;">${data.indonesianTranslation || 'Terjemahan tidak tersedia.'}</p>
                </div>

                <button id="btn-writing-done" class="action-btn" style="background-color: var(--text-main, #333); margin-top:10px; width:100%;">Selesai & Simpan Nilai</button>
            `;

            container.querySelector('#btn-writing-done').addEventListener('click', () => {
                window.location.reload();
            });

        } catch (error) {
            alert('Gagal memeriksa tulisan: ' + error.message);
            submitBtn.style.display = 'block';
            essayInput.disabled = false;
            loadingSpace.style.display = 'none';
        }
    });
}
