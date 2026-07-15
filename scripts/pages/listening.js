export function renderListening(container) {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
    
    container.innerHTML = `
        <div class="welcome-section">
            <h2>🎧 Listening Practice</h2>
            <p>Pilih level kemampuan mendengarmu untuk memulai.</p>
        </div>
        <div class="reading-container" style="text-align:center;">
            <div style="margin-bottom: 20px;">
                ${levels.map(lvl => `<button class="option-btn lvl-btn" data-lvl="${lvl}" style="display:inline-block; width:auto; margin:5px;">${lvl}</button>`).join('')}
            </div>
            <div id="listening-zone" style="display:none;">
                <button id="btn-play-audio" class="action-btn" style="background:#34a853; margin-bottom:15px;">🔊 Putar Audio Teks</button>
                <div id="quiz-zone" style="margin-top:20px; text-align:left;"></div>
            </div>
        </div>
    `;

    let selectedLevel = 'A1';
    // Dummy teks bank listening internal berdasarkan level
    const texts = {
        'A1': { text: "Hello. My name is John. I live in a small house in London. I have a dog named Max.", q: "Where does John live?", options: ["Paris", "London", "New York", "Tokyo"], ans: "London", exp: "John menyebutkan secara langsung: 'I live in a small house in London'." }
    };

    container.querySelectorAll('.lvl-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedLevel = e.target.getAttribute('data-lvl');
            container.getElementById('listening-zone').style.display = 'block';
            startListeningQuiz(selectedLevel);
        });
    });

    function startListeningQuiz(lvl) {
        const data = texts[lvl] || texts['A1']; // fallback ke A1 jika level tinggi belum diisi data teksnya
        const playBtn = container.querySelector('#btn-play-audio');
        
        playBtn.onclick = () => {
            const utterance = new SpeechSynthesisUtterance(data.text);
            utterance.lang = 'en-US';
            utterance.rate = lvl === 'A1' ? 0.8 : 1.0; // Lambat untuk pemula
            window.speechSynthesis.speak(utterance);
        };

        const quizZone = container.querySelector('#quiz-zone');
        quizZone.innerHTML = `
            <p class="question-title"><strong>Pertanyaan:</strong> ${data.q}</p>
            <div class="options-list">
                ${data.options.map(opt => `<button class="option-btn listen-opt" data-val="${opt}">${opt}</button>`).join('')}
            </div>
            <div id="listen-explanation"></div>
        `;

        quizZone.querySelectorAll('.listen-opt').forEach(optBtn => {
            optBtn.addEventListener('click', (e) => {
                const selected = e.target.getAttribute('data-val');
                const expl = quizZone.querySelector('#listen-explanation');
                
                if(selected === data.ans) {
                    e.target.style.background = '#e6f4ea';
                    expl.innerHTML = `<div class="explanation-box" style="border-top-color:var(--secondary-color);"><h4>✅ Benar!</h4><p>${data.exp}</p></div>`;
                } else {
                    e.target.style.background = '#fce8e6';
                    expl.innerHTML = `<div class="explanation-box" style="border-top-color:red;"><h4>❌ Salah</h4><p>Jawaban yang benar adalah <strong>${data.ans}</strong>. ${data.exp}</p></div>`;
                }
            });
        });
    }
}
