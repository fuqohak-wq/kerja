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
    const currentLevel = 'B1'; // Default level, nanti dihubungkan ke Settings

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

            <div id="loading-space" class="loading-box" style="display:none;">
                ⏳ AI sedang membaca dan mengoreksi tulisanmu. Harap tunggu...
            </div>

            <div id="result-space" class="result-card" style="display:none;"></div>
        </div>
    `;

    const submitBtn = document.getElementById('btn-submit-essay');
    const essayInput = document.getElementById('essay-input');
    const loadingSpace = document.getElementById('loading-space');
    const resultSpace = document.getElementById('result-space');

    submitBtn.addEventListener('click', async () => {
        const textValue = essayInput.value.trim();
        
        if (textValue.split(' ').length < 3) {
            alert('Tulisan kamu terlalu pendek. Silakan tulis kalimat yang lebih panjang.');
            return;
        }

        // Tampilkan loading, sembunyikan tombol
        submitBtn.style.display = 'none';
        essayInput.disabled = true;
        loadingSpace.style.display = 'block';
        resultSpace.style.display = 'none';

        try {
            // Panggil Vercel Serverless Function
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

            // Sembunyikan Loading
            loadingSpace.style.display = 'none';
            resultSpace.style.display = 'block';

            // Tampilkan hasil dari AI
            resultSpace.innerHTML = `
                <div style="text-align:center;">
                    <div class="score-badge">Skor AI: ${data.score} / 100</div>
                </div>

                <div class="eval-section">
                    <h4>🔍 Koreksi Tata Bahasa (Grammar)</h4>
                    <p>${data.grammarCorrection}</p>
                </div>

                <div class="eval-section">
                    <h4>📚 Koreksi Kosakata (Vocabulary)</h4>
                    <p>${data.vocabularyCorrection}</p>
                </div>

                <div class="eval-section">
                    <h4>💡 Ekspresi Alami (Natural Expression)</h4>
                    <p>${data.naturalExpression}</p>
                </div>

                <div class="eval-section" style="border-left: 4px solid var(--secondary-color);">
                    <h4>✨ Versi Native Speaker</h4>
                    <p style="font-style: italic; font-weight: 500;">"${data.nativeVersion}"</p>
                </div>

                <div class="eval-section">
                    <h4>🇮🇩 Arti dalam Bahasa Indonesia</h4>
                    <p>${data.indonesianTranslation}</p>
                </div>

                <button id="btn-writing-done" class="action-btn" style="background-color: var(--text-main); margin-top:15px;">Selesai & Kembali</button>
            `;

            document.getElementById('btn-writing-done').addEventListener('click', () => {
                window.location.reload();
            });

        } catch (error) {
            alert(error.message);
            submitBtn.style.display = 'block';
            essayInput.disabled = false;
            loadingSpace.style.display = 'none';
        }
    });
}
