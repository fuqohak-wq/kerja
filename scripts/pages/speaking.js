export function renderSpeaking(container) {
    const roles = ['Guru Bahasa Inggris', 'Teman', 'Barista', 'Kasir', 'Guru Agama', 'Kitab Salaf'];

    container.innerHTML = `
        <div class="welcome-section" style="text-align:center; margin-bottom:20px;">
            <h2>🎤 AI Speaking Call</h2>
            <p style="color:var(--text-muted, #5f6368);">Pilih karakter partner bicaramu dan mulai pengalaman telepon suara.</p>
        </div>
        <div class="reading-container" style="max-width:750px; margin:0 auto; text-align:center;">
            
            <!-- SETUP PANEL -->
            <div id="setup-speaking" style="background:#fff; border:1px solid #dadce0; border-radius:12px; padding:25px; text-align:left; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <label style="display:block; margin-bottom:8px; font-weight:600; color:#202124;">Pilih Partner Roleplay:</label>
                <select id="select-role" style="width:100%; height:45px; margin-bottom:20px; border-radius:8px; border:1px solid #dadce0; padding:0 12px; font-size:1rem;">
                    ${roles.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>

                <label style="display:block; margin-bottom:8px; font-weight:600; color:#202124;">Pilih Gender Suara AI:</label>
                <select id="select-gender" style="width:100%; height:45px; margin-bottom:25px; border-radius:8px; border:1px solid #dadce0; padding:0 12px; font-size:1rem;">
                    <option value="female">👩 Perempuan (Female)</option>
                    <option value="male">👨 Laki-laki (Male)</option>
                </select>

                <button id="btn-start-call" class="action-btn" style="width:100%; background:#34a853; color:white; border:none; padding:14px; border-radius:8px; font-weight:bold; font-size:1.05rem; cursor:pointer;">📞 Mulai Panggilan Telepon</button>
            </div>

            <!-- CALL ACTIVE PANEL -->
            <div id="call-active" style="display:none; background:#fff; border:1px solid #dadce0; border-radius:16px; padding:35px 20px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                <div style="font-size:3.5rem; animation: pulse 1.5s infinite; margin-bottom:10px;">📱</div>
                <h3 id="call-status" style="margin:15px 0; color:var(--primary-color, #1a73e8); font-size:1.15rem;">Menghubungkan...</h3>
                <p id="call-timer" style="font-weight:bold; font-size:1.2rem; color:#1a73e8; margin-bottom:5px;">⏱️ Durasi: 00:00 (Target: 20:00)</p>
                <p id="call-turns" style="font-size:0.95rem; color:#5f6368; margin-bottom:20px;">💬 Jumlah Interaksi Suara: 0 kali</p>
                <p style="color:var(--text-muted, #5f6368); font-size:0.85rem; margin-bottom:25px;">Bicaralah aktif dalam Bahasa Inggris. Sistem menghitung durasi dan keaktifan responmu.</p>
                
                <button id="btn-end-call" class="action-btn" style="background:#ea4335; color:white; border:none; padding:14px 28px; border-radius:30px; font-weight:bold; cursor:pointer; font-size:1rem;">🛑 Akhiri & Kirim Rapor Laporan</button>
            </div>

            <!-- RAPOR HASIL EVALUASI -->
            <div id="speaking-report" style="display:none; text-align:left; background:#fff; border:1px solid #dadce0; border-radius:16px; padding:25px; box-shadow:0 4px 12px rgba(0,0,0,0.05);"></div>
        </div>

        <style>
            @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
        </style>
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
    let currentRole = 'Guru Bahasa Inggris';
    let chosenGender = 'female';
    let isListening = false;
    let silenceTimer = null;
    const SILENCE_DELAY = 4000; 

    let startTime = null;
    let timerInterval = null;
    let totalSeconds = 0;
    let userTurnCount = 0;
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

    // ✅ PERBAIKAN KALKULASI SKOR MATEMATIS YANTI MURNI TANPA BUG 'data'
    function calculateSpeakingScore(seconds, turns) {
        if (seconds <= 0) return 0;
        let baseScore = (seconds / 1200) * 100; // 20 Menit = 100
        if (baseScore > 100) baseScore = 100;

        const requiredTurns = Math.max(1, Math.floor(seconds / 90));
        let activityRatio = turns / requiredTurns;
        if (activityRatio > 1) activityRatio = 1;

        return Math.min(100, Math.max(10, Math.round(baseScore * Math.max(0.4, activityRatio))));
    }

    // Speech Recognition Setup
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
                statusTxt.innerText = "✍️ Merekam obrolanmu...";
                silenceTimer = setTimeout(() => {
                    if (recognition) { try { recognition.stop(); } catch(e){} }
                    userTurnCount++;
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
        await getAIResponse("Hello, let's start our conversation.");
    };

    async function getAIResponse(userText) {
        try {
            window.speechSynthesis.cancel();
            statusTxt.innerText = "⚡ AI sedang berpikir...";
            
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
                aiReply = `That's very interesting. As a ${currentRole}, I'd love to hear more!`;
            } else {
                const resData = await res.json();
                aiReply = resData.reply || `I see. Tell me more about it!`;
            }

            chatHistory.push({ role: 'user', text: userText });
            chatHistory.push({ role: 'model', text: aiReply });

            statusTxt.innerHTML = `<span style="color:#202124; font-size:1rem; display:block; margin-bottom:10px; font-weight:500;">"${aiReply}"</span> 🔊 AI sedang berbicara...`;
            
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
            statusTxt.innerText = "🔊 Memutar respon...";
            setTimeout(startListeningSafely, 2000);
        }
    }

    // ✅ PROSES RAPOR AKHIR DENGAN PENANGANAN ERROR & KOREKSI LENGKAP
    endBtn.onclick = async () => {
        stopTimer();
        statusTxt.innerText = "Menganalisis durasi, interaksi, dan kesalahan...";
        clearTimeout(silenceTimer);
        if (recognition) {
            try { recognition.onend = null; recognition.stop(); } catch(e){}
        }
        window.speechSynthesis.cancel();
        releaseWakeLock();

        const computedScore = calculateSpeakingScore(totalSeconds, userTurnCount);

        if (window.updateGlobalScore) {
            window.updateGlobalScore('speaking', computedScore);
        }

        const minsSpent = Math.floor(totalSeconds / 60);
        const secsSpent = totalSeconds % 60;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    history: chatHistory, 
                    roleplay: currentRole, 
                    level: 'B1', 
                    isFinalReport: true 
                })
            });
            
            let reportData = { mistakes: [] };
            if (res.ok) {
                reportData = await res.json();
            }

            activeDiv.style.display = 'none';
            reportDiv.style.display = 'block';

            // Mendukung 2 Format Array Mistake/Correction dari backend
            const mistakesList = reportData.mistakes || reportData.corrections || [];

            reportDiv.innerHTML = `
                <div style="border-bottom:1px solid #eee; padding-bottom:15px; margin-bottom:20px; text-align:center;">
                    <span style="font-size:3rem;">📊</span>
                    <h3 style="margin:10px 0; color:#1a73e8; font-size:1.4rem;">Rapor Evaluasi AI Speaking</h3>
                    <p style="color:#5f6368; font-size:0.95rem; margin:0;">Roleplay: <strong>${currentRole}</strong></p>
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:20px; text-align:center;">
                    <div style="background:#f8f9fa; border:1px solid #dadce0; padding:15px; border-radius:10px;">
                        <div style="font-size:1.2rem; font-weight:bold; color:#202124;">⏱️ ${minsSpent}m ${secsSpent}s</div>
                        <div style="font-size:0.85rem; color:#5f6368;">Durasi Bicara</div>
                    </div>
                    <div style="background:#f8f9fa; border:1px solid #dadce0; padding:15px; border-radius:10px;">
                        <div style="font-size:1.2rem; font-weight:bold; color:#202124;">💬 ${userTurnCount} Kali</div>
                        <div style="font-size:0.85rem; color:#5f6368;">Respon Suara</div>
                    </div>
                </div>

                <div style="text-align:center; margin-bottom:25px;">
                    <div style="display:inline-block; background:#1a73e8; color:#fff; padding:10px 30px; border-radius:30px; font-weight:bold; font-size:1.3rem; box-shadow:0 3px 8px rgba(26,115,232,0.3);">
                        Skor Akhir Speaking: ${computedScore} / 100
                    </div>
                </div>

                <h4 style="color:#ea4335; margin-bottom:12px; font-size:1.1rem;">🛠️ Analisis Kesalahan & Koreksi Perbaikan:</h4>
                ${mistakesList.length > 0 ? `
                    <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:25px;">
                        ${mistakesList.map(m => `
                            <div style="border-left:4px solid #ea4335; background:#fdf5f5; padding:12px 15px; border-radius:8px;">
                                <div style="color:#c5221f; font-size:0.95rem;">❌ <strong>Ucapan:</strong> "${m.user || m.original || '-'}"</div>
                                <div style="color:#137333; font-weight:bold; font-size:0.95rem; margin-top:4px;">✅ <strong>Perbaikan:</strong> "${m.correct || m.corrected || '-'}"</div>
                                <div style="color:#5f6368; font-size:0.85rem; margin-top:4px;">💡 <em>${m.explanation || m.reason || ''}</em></div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="background:#f4faf6; border-left:4px solid #34a853; padding:15px; border-radius:8px; color:#137333; font-size:0.95rem; margin-bottom:25px;">
                        🎉 Masya Allah! Luar biasa, tidak ditemukan kesalahan tata bahasa yang signifikan dalam percakapan Anda!
                    </div>
                `}

                <button id="btn-done-speaking" class="action-btn" style="width:100%; background:#1a73e8; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">Selesai & Latihan Lagi</button>
            `;

            reportDiv.querySelector('#btn-done-speaking').onclick = () => {
                window.location.reload();
            };

        } catch(err) {
            console.error("Report Error:", err);
            alert("Sesi latihan selesai.");
            window.location.reload();
        }
    };
}
