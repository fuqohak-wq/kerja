export function renderSpeaking(container) {
    const roles = ['Guru Bahasa Inggris', 'Teman', 'Barista', 'Kasir', 'Petugas Imigrasi', 'Interviewer'];
    
    container.innerHTML = `
        <div class="welcome-section">
            <h2>🎤 AI Speaking Call</h2>
            <p>Pilih karakter partner bicaramu dan mulai pengalaman telepon suara.</p>
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
                <div style="font-size:3rem; animation: pulse 1.5s infinite;">📱</div>
                <h3 id="call-status" style="margin:20px 0; color:var(--primary-color);">Menghubungkan...</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:30px;">Bicaralah penuh dalam Bahasa Inggris saat status menunjukkan "Mendengarkan..."</p>
                <button id="btn-end-call" class="action-btn" style="background:#ea4335;">🛑 Akhiri & Kirim Rapor Laporan</button>
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
    let isListening = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechObj = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechObj();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            statusTxt.innerText = "🎙️ Mendengarkan... (Silakan Bicara)";
        };

        recognition.onend = () => {
            isListening = false;
            if (statusTxt.innerText.includes("Mendengarkan")) {
                statusTxt.innerText = "⏳ Memproses ucapanmu...";
            }
        };

        recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript;
            if (speechToText.trim()) {
                getAIResponse(speechToText);
            }
        };

        recognition.onerror = (e) => {
            console.error("Speech Error:", e);
            statusTxt.innerText = "🎙️ Giliranmu bicara...";
            startListeningSafely();
        };
    }

    function startListeningSafely() {
        if (recognition && !isListening) {
            try { recognition.start(); } catch(err) { console.log(err); }
        }
    }

    startBtn.onclick = async () => {
        currentRole = container.querySelector('#select-role').value;
        setupDiv.style.display = 'none';
        activeDiv.style.display = 'block';
        
        await getAIResponse("Hello, let's start the conversation.");
    };

    async function getAIResponse(userText) {
        try {
            window.speechSynthesis.cancel();
            statusTxt.innerText = "⚡ AI sedang membalas...";
            
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message: userText, history: chatHistory, roleplay: currentRole, level: 'B1' })
            });
            const data = await res.json();
            
            chatHistory.push({ role: 'user', text: userText });
            chatHistory.push({ role: 'model', text: data.reply || data.error });

            statusTxt.innerText = "🔊 AI sedang berbicara...";
            const utterance = new SpeechSynthesisUtterance(data.reply || "I cannot hear you clearly.");
            utterance.lang = 'en-US';
            
            utterance.onend = () => {
                startListeningSafely();
            };
            window.speechSynthesis.speak(utterance);

        } catch(e) {
            statusTxt.innerText = "Gagal memuat respons suara AI.";
            setTimeout(startListeningSafely, 2000);
        }
    }

    endBtn.onclick = async () => {
        statusTxt.innerText = "Membuat evaluasi grammar & pronunciation akhir...";
        if (recognition) {
            try { recognition.onend = null; recognition.stop(); } catch(e){}
        }
        window.speechSynthesis.cancel();

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
                <h3 style="margin-bottom:15px; color:var(--primary-color);">📊 Rapor Evaluasi Akhir</h3>
                <div class="score-badge" style="margin-bottom:15px; display:inline-block;">Skor Akhir: ${report.overall || 0}</div>
                
                <p><strong>Fluency:</strong> ${report.fluency || 0} | <strong>Grammar:</strong> ${report.grammar || 0}</p>
                <p><strong>Pronunciation:</strong> ${report.pronunciation || 0} | <strong>Vocabulary:</strong> ${report.vocabulary || 0}</p>
                
                <h4 style="color:#ea4335; margin-top:20px;">❌ Analisis Kesalahan:</h4>
                ${(report.mistakes || []).map(m => `
                    <div class="eval-section" style="border-left:3px solid red;">
                        <p style="color:red;">Kamu: "${m.user}"</p>
                        <p style="color:green;">Benar: "${m.correct}"</p>
                        <p><small>Info: ${m.explanation}</small></p>
                    </div>
                `).join('')}
                
                <button onclick="window.location.reload()" class="action-btn" style="margin-top:20px;">Selesai</button>
            `;
        } catch(err) {
            alert("Error menyusun rapor.");
            window.location.reload();
        }
    };
}
