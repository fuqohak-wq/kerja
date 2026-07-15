export function renderSpeaking(container) {
    const roles = ['Guru Bahasa Inggris', 'Teman', 'Barista', 'Kasir', 'Petugas Imigrasi', 'Interviewer'];
    
    container.innerHTML = `
        <div class="welcome-section">
            <h2>🎤 AI Speaking Call</h2>
            <p>Pilih karakter partner bicaramu dan mulai pengalaman telepon.</p>
        </div>
        <div class="reading-container" style="text-align:center;">
            <div id="setup-speaking">
                <label style="display:block; margin-bottom:10px; font-weight:600;">Pilih Partner Roleplay:</label>
                <select id="select-role" class="writing-textarea" style="height:50px; margin-bottom:20px;">
                    ${roles.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
                <button id="btn-start-call" class="action-btn">📞 Mulai Panggilan</button>
            </div>

            <div id="call-active" style="display:none; padding:40px 20px;">
                <div class="calling-animation">🎙️</div>
                <h3 id="call-status" style="margin:20px 0; color:var(--primary-color);">Menghubungkan ke AI...</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:30px;">Bicaralah dalam bahasa Inggris setelah status berubah menjadi "Mendengarkan..."</p>
                <button id="btn-end-call" class="action-btn" style="background:#ea4335;">🛑 Akhiri & Lihat Rapor</button>
            </div>

            <div id="speaking-report" style="display:none; text-align:left;"></div>
        </div>
    `;

    const startBtn = container.querySelector('#btn-start-call');
    const endBtn = container.querySelector('#btn-end-call');
    const setupDiv = container.querySelector('#setup-speaking');
    const activeDiv = container.querySelector('#call-active');
    const statusTxt = container.querySelector('#call-status');
    const reportDiv = container.querySelector('#speaking-report');

    let chatHistory = [];
    let recognition = null;
    let currentRole = 'Teman';

    // Inisialisasi Speech Recognition Browser
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechObj = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechObj();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
    }

    startBtn.onclick = async () => {
        currentRole = container.querySelector('#select-role').value;
        setupDiv.style.display = 'none';
        activeDiv.style.display = 'block';
        
        // Sapaan pertama dari AI
        statusTxt.innerText = "AI sedang mengetik sapaan...";
        await getAIResponse("Hello, let's start talking.");
    };

    async function getAIResponse(userText) {
        try {
            statusTxt.innerText = "AI sedang berpikir...";
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message: userText, history: chatHistory, roleplay: currentRole, level: 'B1' })
            });
            const data = await res.json();
            
            chatHistory.push({ role: 'user', text: userText });
            chatHistory.push({ role: 'model', text: data.reply });

            // AI Berbicara menggunakan suara
            statusTxt.innerText = "📱 AI sedang berbicara...";
            const utterance = new SpeechSynthesisUtterance(data.reply);
            utterance.lang = 'en-US';
            
            utterance.onend = () => {
                // Setelah AI selesai ngomong, mikrofon otomatis menyala mendengar user
                if(recognition) {
                    statusTxt.innerText = "🎙️ Mendengarkan (Silakan Bicara)...";
                    recognition.start();
                }
            };
            window.speechSynthesis.speak(utterance);

        } catch(e) {
            statusTxt.innerText = "Koneksi terputus. Mengulangi...";
            setTimeout(() => recognition.start(), 2000);
        }
    }

    if (recognition) {
        recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript;
            getAIResponse(speechToText);
        };

        recognition.onerror = () => {
            // Jika hening atau error, nyalakan kembali mikrofon secara berkala layaknya telepon live
            statusTxt.innerText = "🎙️ Mendengarkan...";
            try { recognition.start(); } catch(e){}
        };
    }

    endBtn.onclick = async () => {
        if(recognition) try { recognition.stop(); } catch(e){}
        window.speechSynthesis.cancel();

        statusTxt.innerText = "Menyusun rapor evaluasi AI...";
        
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ history: chatHistory, roleplay: currentRole, level: 'B1', isFinalReport: true })
            });
            const report = await res.json();
            
            activeDiv.style.display = 'none';
            reportDiv.style.display = 'block';

            reportDiv.innerHTML = `
                <h3 style="margin-bottom:15px; text-align:center; color:var(--primary-color);">📊 Rapor Hasil Panggilan Telepon</h3>
                <div class="score-badge" style="display:block; text-align:center; margin-bottom:20px;">Skor Akhir: ${report.overall} / 100</div>
                
                <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:0.9rem;">
                    <tr style="border-bottom:1px solid #ddd;"><td style="padding:6px 0;">Grammar:</td><td style="text-align:right; font-weight:bold;">${report.grammar}</td></tr>
                    <tr style="border-bottom:1px solid #ddd;"><td style="padding:6px 0;">Vocabulary:</td><td style="text-align:right; font-weight:bold;">${report.vocabulary}</td></tr>
                    <tr style="border-bottom:1px solid #ddd;"><td style="padding:6px 0;">Fluency:</td><td style="text-align:right; font-weight:bold;">${report.fluency}</td></tr>
                    <tr style="border-bottom:1px solid #ddd;"><td style="padding:6px 0;">Pronunciation:</td><td style="text-align:right; font-weight:bold;">${report.pronunciation}</td></tr>
                </table>

                <h4 style="color:#ea4335; margin-bottom:8px;">❌ Kesalahan Grammar yang Ditemukan:</h4>
                ${report.mistakes.map(m => `
                    <div class="eval-section" style="border-left: 3px solid #ea4335;">
                        <p style="color:red;"><strong>Kamu:</strong> "${m.user}"</p>
                        <p style="color:green;"><strong>Benar:</strong> "${m.correct}"</p>
                        <p style="font-size:0.85rem; color:var(--text-muted);">${m.explanation}</p>
                    </div>
                `).join('')}

                <h4 style="color:var(--primary-color); margin-top:20px; margin-bottom:8px;">📚 Kosakata Baru untuk Dipelajari:</h4>
                ${report.newVocab.map(v => `
                    <p><strong>${v.word}</strong> (${v.meaning}) : <em>${v.example}</em></p>
                `).join('')}

                <div class="explanation-box" style="margin-top:20px;">
                    <h4>💡 Saran Latihan Berikutnya:</h4>
                    <p>${report.nextSuggestion}</p>
                </div>
                <button onclick="window.location.reload()" class="action-btn" style="margin-top:20px;">Selesai & Kembali</button>
            `;
        } catch(e) {
            alert("Gagal memuat analisis rapor percakapan.");
            window.location.reload();
        }
    };
}
