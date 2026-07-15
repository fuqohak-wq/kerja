import { fetchQuestionBank } from '../config/sheetsConfig.js';

let currentQuestions = [];
let currentIndex = 0;
let score = 0;

export async function renderReading(container) {
    container.innerHTML = `
        <div class="welcome-section">
            <h2>📖 Reading Practice</h2>
            <p>Memuat bank soal dari Google Sheets...</p>
        </div>
    `;

    // Ambil data dari Google Sheets
    const data = await fetchQuestionBank();
    
    // Filter data yang memiliki konten esensial (menghindari baris kosong)
    currentQuestions = data.filter(q => q.text || q.artikel || q.q || q.pertanyaan);

    if (currentQuestions.length === 0) {
        container.innerHTML = `
            <div class="welcome-section">
                <h2>📖 Reading Practice</h2>
                <p style="color:red;">Gagal memuat soal atau Google Sheet kosong. Pastikan akses Sheet adalah 'Public/Anyone with link'.</p>
                <button id="btn-back-home" class="action-btn">Kembali ke Beranda</button>
            </div>
        `;
        document.getElementById('btn-back-home').addEventListener('click', () => window.location.reload());
        return;
    }

    currentIndex = 0;
    score = 0;
    showQuestion(container);
}

function showQuestion(container) {
    if (currentIndex >= currentQuestions.length) {
        showResult(container);
        return;
    }

    const item = currentQuestions[currentIndex];
    
    // Pemetaan nama kolom fleksibel (mendukung format bahasa inggris / indonesia di sheet Anda)
    const artikelText = item.text || item.artikel || "No Article Text Provided";
    const judulArtikel = item.judul || item.topic || `Reading Question #${currentIndex + 1}`;
    const pertanyaanText = item.q || item.pertanyaan || "Answer the question based on the text above:";
    
    const optA = item.a || item['pilihan a'] || '';
    const optB = item.b || item['pilihan b'] || '';
    const optC = item.c || item['pilihan c'] || '';
    const optD = item.d || item['pilihan d'] || '';
    
    // Ambil kunci jawaban asli (A, B, C, atau D)
    const correctAnswer = (item.answer || item.jawaban || '').trim().toUpperCase();
    const pembahasanText = item.pembahasan || item.explanation || "Tidak ada pembahasan untuk soal ini.";

    container.innerHTML = `
        <div class="welcome-section">
            <h2>📖 ${judulArtikel}</h2>
            <p>Soal ${currentIndex + 1} dari ${currentQuestions.length} | Level: ${item.level || 'General'}</p>
        </div>

        <div class="reading-container">
            <div class="article-box">${artikelText}</div>
            <div class="question-title">${pertanyaanText}</div>
            
            <div class="options-list">
                <button class="option-btn" data-ans="A"><strong>A.</strong> ${optA}</button>
                <button class="option-btn" data-ans="B"><strong>B.</strong> ${optB}</button>
                <button class="option-btn" data-ans="C"><strong>C.</strong> ${optC}</button>
                <button class="option-btn" data-ans="D"><strong>D.</strong> ${optD}</button>
            </div>

            <div id="explanation-space"></div>
            <button id="btn-action" class="action-btn" style="display:none;">Pertanyaan Selanjutnya</button>
        </div>
    `;

    const optionButtons = container.querySelectorAll('.option-btn');
    let hasAnswered = false;

    optionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (hasAnswered) return;
            hasAnswered = true;

            const selectedAns = e.currentTarget.getAttribute('data-ans');
            
            // Validasi jawaban benar / salah
            if (selectedAns === correctAnswer) {
                e.currentTarget.classList.add('correct');
                score++;
            } else {
                e.currentTarget.classList.add('wrong');
                // Beri highlight hijau pada jawaban yang seharusnya benar
                optionButtons.forEach(b => {
                    if (b.getAttribute('data-ans') === correctAnswer) b.classList.add('correct');
                });
            }

            // Tampilkan Pembahasan
            const explanationSpace = document.getElementById('explanation-space');
            explanationSpace.innerHTML = `
                <div class="explanation-box">
                    <h4>💡 Pembahasan (${correctAnswer}):</h4>
                    <p>${pembahasanText}</p>
                </div>
            `;

            // Tampilkan tombol Lanjut
            const actionBtn = document.getElementById('btn-action');
            actionBtn.style.display = 'block';
            actionBtn.addEventListener('click', () => {
                currentIndex++;
                showQuestion(container);
            });
        });
    });
}

function showResult(container) {
    const finalScore = Math.round((score / currentQuestions.length) * 100);
    container.innerHTML = `
        <div class="welcome-section">
            <h2>🎉 Selesai Latihan!</h2>
            <p>Berikut adalah ringkasan hasil membaca kamu hari ini.</p>
        </div>

        <div class="reading-container" style="text-align:center; padding: 40px 20px;">
            <div style="font-size: 4rem; margin-bottom: 10px;">🏆</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 8px;">Skor Akhir Anda</h3>
            <div style="font-size: 3.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 20px;">
                ${finalScore} <span style="font-size:1.2rem; color:var(--text-muted);">/ 100</span>
            </div>
            <p style="margin-bottom: 24px; color: var(--text-muted);">
                Anda menjawab benar <strong>${score}</strong> dari <strong>${currentQuestions.length}</strong> soal.
            </p>
            <button id="btn-finish" class="action-btn">Kembali ke Beranda</button>
        </div>
    `;

    document.getElementById('btn-finish').addEventListener('click', () => {
        // Memicu reload/kembali router ke home
        window.location.reload();
    });
}
