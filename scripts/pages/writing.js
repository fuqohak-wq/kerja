const WRITING_TOPICS = [
    "Describe your hometown and what makes it special.",
    "What are the advantages and disadvantages of working from home?",
    "Talk about a memorable holiday or trip you took in the past.",
    "Why do you think learning English is important for your future career?",
    "Describe your favorite hobby and how you got started with it.",
    "How does social media affect modern relationships and communication?",
    "Describe a goal you want to achieve in the next five years.",
    "What is the best piece of advice you have ever received in your life?"
];

export function renderWriting(container) {
    const randomTopic = WRITING_TOPICS[Math.floor(Math.random() * WRITING_TOPICS.length)];
    const currentLevel = 'B1';

    container.innerHTML = `
        <div class="welcome-section">
            <h2>✍️ Writing Practice</h2>
            <p>Tulis esai singkat berdasarkan tema di bawah ini untuk mendapatkan evaluasi mendalam dari AI.</p>
        </div>

        <div class="writing-container" style="max-width:800px; margin:0 auto; padding:10px;">
            <div class="topic-box" style="background:#f4faf6; border-left:5px solid #34a853; padding:15px; border-radius:8px; margin-bottom:20px;">
                <small style="color:#137333; font-weight:bold; display:block; margin-bottom:4px;">TEMA HARI INI:</small>
                <strong style="font-size:1.1rem; color:#202124;">"${randomTopic}"</strong>
            </div>

            <textarea id="essay-input" class="writing-textarea" style="width:100%; height:160px; padding:14px; border-radius:10px; border:1px solid #ccc; font-size:1rem; font-family:inherit; box-sizing:border-box; margin-bottom:15px;" placeholder="Tulis jawaban bahasa Inggris kamu di sini (minimal 5 kata)..."></textarea>
            
            <button id="btn-submit-essay" class="action-btn" style="width:100%; padding:12px; background:#1a73e8; color:white; border:none; border-radius:8px; font-size:1rem; font-weight:bold; cursor:pointer;">Kirim & Periksa dengan AI 🚀</button>

            <div id="loading-space" class="loading-box" style="display:none; text-align:center; padding:25px; color:#1a73e8;">
                <div class="spinner" style="border:4px solid #f3f3f3; border-top:4px solid #1a73e8; border-radius:50%; width:35px; height:35px; animation:spin 1s linear infinite; margin:0 auto 15px auto;"></div>
                <p id="writing-status-text" style="font-weight:bold; margin:0;">⏳ AI sedang membaca, menganalisis, dan mengoreksi tulisanmu...</p>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            </div>

            <div id="result-space" class="result-card" style="display:none; margin-top:20px; background:#fff; border:1px solid #dadce0; padding:20px; border-radius:12px; text-align:left;"></div>
        </div>
    `;

    const submitBtn = container.querySelector('#btn-submit-essay');
    const essayInput = container.querySelector('#essay-input');
    const loadingSpace = container.querySelector('#loading-space');
    const loadingStatusText = container.querySelector('#writing-status-text');
    const resultSpace = container.querySelector('#result-space');

    submitBtn.addEventListener('click', async () => {
        const textValue = essayInput.value.trim();
        
        if (textValue.split(/\s+/).filter(Boolean).length < 5) {
            alert('Tulisan kamu terlalu pendek. Silakan tulis kalimat yang lebih panjang (minimal 5 kata).');
            return;
        }

        submitBtn.style.display = 'none';
        essayInput.disabled = true;
        loadingSpace.style.display = 'block';
        resultSpace.style.display = 'none';

        const maxRetries = 2;
        let attempt = 0;
        let success = false;

        while (attempt <= maxRetries && !success) {
            try {
                attempt++;
                if (attempt > 1) {
                    loadingStatusText.innerText = `⏳ Menghubungkan ulang ke AI Evaluator (Percobaan ${attempt}/${maxRetries + 1})...`;
                } else {
                    loadingStatusText.innerText = "⏳ AI sedang membaca, menganalisis, dan mengoreksi tulisanmu...";
                }

                const response = await fetch('/api/writing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: textValue,
                        prompt: randomTopic,
                        level: currentLevel,
                        timestamp: Date.now()
                    })
                });

                if (!response.ok) throw new Error('Gagal terhubung dengan server AI.');
                const data = await response.json();

                let writingScore = Number(data.score || data.overallScore || data.finalScore);
                if (isNaN(writingScore) || writingScore === undefined) {
                    writingScore = 75;
                }
                writingScore = Math.min(100, Math.max(0, Math.round(writingScore)));

                if (window.updateGlobalScore) {
                    window.updateGlobalScore('writing', writingScore);
                }

                loadingSpace.style.display = 'none';
                resultSpace.style.display = 'block';

                const grammarText = data.grammarCorrection || 'Grammar Anda sudah bagus.';
                const vocabText = data.vocabCorrection || 'Penggunaan kata sudah tepat.';
                const expressionText = data.naturalExpression || 'Kalimat dapat dipahami dengan baik.';
                const improvedText = data.improvedVersion || textValue;
                const translationText = data.indonesianTranslation || 'Terjemahan tidak tersedia.';

                resultSpace.innerHTML = `
                    <div style="text-align:center; margin-bottom:20px;">
                        <div class="score-badge" style="display:inline-block; font-size:1.4rem; padding:10px 30px; background:#1a73e8; color:#fff; border-radius:30px; font-weight:bold;">
                            Skor Evaluasi AI: ${writingScore} / 100
                        </div>
                    </div>

                    <div class="eval-section" style="margin-bottom:15px; background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #e0e0e0;">
                        <h4 style="margin:0 0 8px 0; color:#1a73e8;">🔍 Koreksi Tata Bahasa (Grammar)</h4>
                        <p style="margin:0; font-size:0.95rem; color:#202124; line-height:1.6;">${grammarText}</p>
                    </div>

                    <div class="eval-section" style="margin-bottom:15px; background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #e0e0e0;">
                        <h4 style="margin:0 0 8px 0; color:#1a73e8;">📚 Koreksi Kosakata (Vocabulary)</h4>
                        <p style="margin:0; font-size:0.95rem; color:#202124; line-height:1.6;">${vocabText}</p>
                    </div>

                    <div class="eval-section" style="margin-bottom:15px; background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #e0e0e0;">
                        <h4 style="margin:0 0 8px 0; color:#1a73e8;">💡 Ekspresi Alami (Natural Expression)</h4>
                        <p style="margin:0; font-size:0.95rem; color:#202124; line-height:1.6;">${expressionText}</p>
                    </div>

                    <div class="eval-section" style="margin-bottom:15px; border-left: 4px solid #34a853; background:#f4faf6; padding:15px; border-radius:8px;">
                        <h4 style="margin:0 0 8px 0; color:#2d8e47;">✨ Versi Lebih Alami (Native Version)</h4>
                        <p style="font-style: italic; font-weight: 500; margin:0; color:#137333; font-size:1rem; line-height:1.6;">"${improvedText}"</p>
                    </div>

                    <div class="eval-section" style="margin-bottom:20px; border-left: 4px solid #1a73e8; background:#e8f0fe; padding:15px; border-radius:8px;">
                        <h4 style="margin:0 0 8px 0; color:#185abc;">🇮🇩 Arti dalam Bahasa Indonesia</h4>
                        <p style="margin:0; color:#174ea6; font-weight:500; font-size:0.95rem; line-height:1.6;">"${translationText}"</p>
                    </div>

                    <button id="btn-writing-done" class="action-btn" style="background-color: #3c4043; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; width:100%;">🔄 Selesai & Latihan Tema Lain</button>
                `;

                container.querySelector('#btn-writing-done').addEventListener('click', () => {
                    renderWriting(container);
                });

                success = true;

            } catch (error) {
                console.warn(`[Writing Retry Warning] Percobaan ke-${attempt} gagal:`, error.message);
                if (attempt > maxRetries) {
                    alert('Gagal memeriksa tulisan: ' + error.message);
                    submitBtn.style.display = 'block';
                    essayInput.disabled = false;
                    loadingSpace.style.display = 'none';
                } else {
                    await new Promise(r => setTimeout(r, 1200));
                }
            }
        }
    });
}
