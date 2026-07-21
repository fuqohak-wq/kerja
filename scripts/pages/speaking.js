export function renderSpeaking(container) {
    const roles = ['Guru Bahasa Inggris', 'Teman', 'Barista', 'Kasir', 'Guru Agama', 'Kitab Salaf'];
    
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

                <label style="display:block; margin-bottom:10px; font-weight:600;">Pilih Gender Suara AI:</label>
                <select id="select-gender" class="writing-textarea" style="height:50px; margin-bottom:20px;">
                    <option value="female">👩 Perempuan (Female)</option>
                    <option value="male">👨 Laki-laki (Male)</option>
                </select>

                <button id="btn-start-call" class="action-btn">📞 Mulai Panggilan</button>
            </div>

            <div id="call-active" style="display:none; padding:40px 20px;">
                <div style="font-size:3rem; animation: pulse 1.5s infinite;">📱</div>
                <h3 id="call-status" style="margin:20px 0; color:var(--primary-color);">Menghubungkan...</h3>
                <p id="call-timer" style="font-weight:bold; font-size:1.1rem; color:#1a73e8; margin-bottom:5px;">⏱️ Durasi: 00:00 (Target: 20:00)</p>
                <p id="call-turns" style="font-size:0.9rem; color:#5f6368; margin-bottom:20px;">💬 Jumlah Interaksi Suara: 0 kali</p>
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:30px;">Bicaralah aktif dalam Bahasa Inggris. Sistem menghitung durasi dan keaktifan responmu.</p>
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
    const timerTxt = container.querySelector('#call-timer');
    const turnsTxt = container.querySelector('#call-turns');

    let chatHistory = [];
    let recognition = null;
    let currentRole = 'Teman';
    let chosenGender = 'female';
    let isListening = false;
    let silenceTimer = null;
    const SILENCE_DELAY = 5000; 

    // Variabel Pelacak Waktu & Interaksi
    let startTime = null;
    let timerInterval = null;
    let totalSeconds = 0;
    let userTurnCount = 0; // Menghitung berapa kali user merespon suara

    let wakeLock = null;

    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.warn("Wake lock error:", err.message);
        }
    }

    function releaseWakeLock() {
        if (wakeLock !== null) {
            wakeLock.release().then(() => { wakeLock = null; });
        }
    }

    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(() => {
            totalSeconds = Math.floor((Date.now() - startTime) / 1000);
            const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
            const secs = String(totalSeconds % 60).padStart(2, '0');
            timerTxt.innerText = `⏱️ Durasi: ${mins}:${secs} (Target: 20:00)`;
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
    }

    // Kalkulasi Skor Bertingkat (5m=25, 10m=50, 15m=75, 20m=100) + Penalty jika diam saja
    function calculateSpeakingScore(seconds, turns) {
        if (seconds <= 0) return 0;

        // 1. Hitung potensi skor berdasarkan waktu linier (1200 detik = 20 menit = 100 poin)
        let baseScore = (seconds / 1200) * 100;
        if (baseScore > 100) baseScore = 100;

        // 2. Cek rasio keaktifan interaksi (minimal 1 respon per 90 detik)
        const requiredTurns = Math.max(1, Math.floor(seconds / 90));
        let activityRatio = turns / requiredTurns;
        if (activityRatio > 1) activityRatio = 1; // Maksimal 100% dari rasio

        // 3. Skor Akhir = Hasil Waktu * Rasio Keaktifan
        const finalScore = Math.round(baseScore * activityRatio);
        return Math.min(100, Math.max(0, finalScore));
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechObj = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechObj();
        recognition.continuous = true; 
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            statusTxt.innerText = "🎙️ Mendengarkan... (Silakan Bicara)";
        };

        recognition.onend = () => { isListening = false; };

        recognition.onresult = (event) => {
            clearTimeout(silenceTimer);
            const lastResultIndex = event.results.length - 1;
            const speechToText = event.results[lastResultIndex][0].transcript;
            
            if (speechToText.trim()) {
                statusTxt.innerText = "✍️ Sedang merekam obrolanmu...";
                silenceTimer = setTimeout(() => {
                    if (recognition) { try { recognition.stop(); } catch(e){} }
                    userTurnCount++; // Tambah jumlah interaksi pengguna
                    turnsTxt.innerText = `💬 Jumlah Interaksi Suara: ${userTurnCount} kali`;
                    getAIResponse(speechToText);
                }, SILENCE_DELAY);
            }
        };

        recognition.onerror = (e) => {
            if (e.error !== 'no-speech') {
                statusTxt.innerText = "🎙️ Memulihkan koneksi mic...";
                setTimeout(startListeningSafely, 1000);
            }
        };
    }

    function startListeningSafely() {
        if (recognition && !isListening) {
            try { recognition.start(); } catch(err) {}
        }
    }

    startBtn.onclick = async () => {
        chatHistory = []; 
        userTurnCount = 0;
        currentRole = container.querySelector('#select-role').value;
        chosenGender = container.querySelector('#select-gender').value;
        setupDiv.style.display = 'none';
        activeDiv.style.display = 'block';
        
        await requestWakeLock();
        startTimer();
        await getAIResponse("Hello, let's start the conversation.");
    };

    async function getAIResponse(userText) {
        try {
            window.speechSynthesis.cancel();
            statusTxt.innerText = "⚡ AI sedang membalas...";
            
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    message: userText, 
                    history: chatHistory, 
                    roleplay: currentRole, 
                    level: 'B1',
                    isFinalReport: false 
                })
            });

            let aiReply = "";
            if (!res.ok) {
                aiReply = `That's interesting. Tell me more about it as a ${currentRole}!`;
            } else {
                const data = await res.json();
                aiReply = data.reply || `I see. Tell me more about it!`;
            }

            chatHistory.push({ role: 'user', text: userText });
            chatHistory.push({ role: 'model', text: aiReply });

            statusTxt.innerHTML = `<span style="color:var(--text-main); font-size:1rem; display:block; margin-bottom:10px;">"${aiReply}"</span> 🔊 AI sedang berbicara...`;
            
            const utterance = new SpeechSynthesisUtterance(aiReply);
            utterance.lang = 'en-US';
            
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => {
                const isEnglish = voice.lang.startsWith('en');
                const nameLower = voice.name.toLowerCase();
                if (isEnglish) {
                    if (chosenGender === 'male') {
                        return nameLower.includes('male') || nameLower.includes('david') || nameLower.includes('guy');
                    } else {
                        return nameLower.includes('female') || nameLower.includes('zira') || nameLower.includes('samantha');
                    }
                }
                return false;
            });

            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.onend = () => { startListeningSafely(); };
            window.speechSynthesis.speak(utterance);

        } catch(e) {
            statusTxt.innerText = "🔊 Memutar respon cadangan...";
            setTimeout(startListeningSafely, 2000);
        }
    }

    endBtn.onclick = async () => {
        stopTimer();
        statusTxt.innerText = "Menganalisis durasi, interaksi, dan kesalahan...";
        clearTimeout(silenceTimer);
        if (recognition) {
            try { recognition.onend = null; recognition.stop(); } catch(e){}
        }
        window.speechSynthesis.cancel();
        releaseWakeLock();

        // Hitung skor akhir berdasarkan kriteria interaktif
        const computedScore = calculateSpeakingScore(totalSeconds, userTurnCount);

        // KANTONGI NILAI KEMBALIKAN KE GLOBAL SCORE
        if (window.updateGlobalScore) {
            window.updateGlobalScore('speaking', computedScore);
        }

        const minsSpent = Math.floor(totalSeconds / 60);
        const secsSpent = totalSeconds % 60;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ history: chatHistory, roleplay: currentRole, level: 'B1', isFinalReport: true })
            });
            
            let report;
            if (!res.ok) {
                report = { mistakes: [] };
            } else {
                report = await res.json();
            }

            activeDiv.style.display = 'none';
            reportDiv.style.display = 'block';

            reportDiv.innerHTML = `
                <h3 style="margin-bottom:15px; color:var(--primary-color);">📊 Rapor Evaluasi Speaking</h3>
                <p>⏱️ Durasi Telepon: <strong>${minsSpent} menit ${secsSpent} detik</strong></p>
                <p>💬 Keaktifan Obrolan: <strong>${userTurnCount} kali merespon</strong></p>
                
                <div class="score-badge" style="margin: 15px 0; display:inline-block; background:#1a73e8; color:#fff; padding:8px 20px; border-radius:20px; font-weight:bold; font-size:1.1rem;">
                    Skor Akhir Speaking: ${computedScore} / 100
                </div>

                <div style="background:#f8f9fa; padding:12px; border-radius:8px; font-size:0.85rem; color:#5f6368; margin-bottom:20px;">
                    💡 <em>Skema Penilaian: 5m = 25 | 10m = 50 | 15m = 75 | 20m = 100 (Disertai syarat keaktifan respon suara).</em>
                </div>

                <h4 style="color:#ea4335; margin-top:20px;">❌ Analisis Kesalahan AI:</h4>
                ${(report.mistakes || []).length > 0 ? report.mistakes.map(m => `
                    <div class="eval-section" style="border-left:3px solid red; padding-left:10px; margin-bottom:10px; background:#fff5f5;">
                        <p style="color:red; margin:2px 0;">Kamu: "${m.user}"</p>
                        <p style="color:green; margin:2px 0;">Benar: "${m.correct}"</p>
                        <p style="margin:2px 0;"><small>Info: ${m.explanation}</small></p>
                    </div>
                `).join('') : '<p>Luar biasa, tidak ditemukan kesalahan tata bahasa yang signifikan!</p>'}
                
                <button onclick="window.location.reload()" class="action-btn" style="margin-top:20px;">Selesai Latihan</button>
            `;
        } catch(err) {
            alert("Sesi latihan selesai.");
            window.location.reload();
        }
    };
}
