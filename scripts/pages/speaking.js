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
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:30px;">Bicaralah penuh dalam Bahasa Inggris. Sistem akan mengirim suara otomatis jika Anda diam selama 5 detik.</p>
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
    let chosenGender = 'female';
    let isListening = false;
    let silenceTimer = null;
    const SILENCE_DELAY = 5000; 

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

        recognition.onend = () => {
            isListening = false;
        };

        recognition.onresult = (event) => {
            clearTimeout(silenceTimer);
            const lastResultIndex = event.results.length - 1;
            const speechToText = event.results[lastResultIndex][0].transcript;
            
            if (speechToText.trim()) {
                statusTxt.innerText = "✍️ Sedang merekam obrolanmu...";
                silenceTimer = setTimeout(() => {
                    if (recognition) { try { recognition.stop(); } catch(e){} }
                    getAIResponse(speechToText);
                }, SILENCE_DELAY);
            }
        };

        recognition.onerror = (e) => {
            console.error("Speech Error:", e);
            if (e.error !== 'no-speech') {
                statusTxt.innerText = "🎙️ Memulihkan koneksi mic...";
                setTimeout(startListeningSafely, 1000);
            }
        };
    }

    function startListeningSafely() {
        if (recognition && !isListening) {
            try { 
                recognition.start(); 
            } catch(err) { 
                console.log("Mic restart log:", err); 
            }
        }
    }

    startBtn.onclick = async () => {
        // Reset mutlak riwayat percakapan agar tidak ada sisa sesi sebelumnya yang bikin error
        chatHistory = []; 
        currentRole = container.querySelector('#select-role').value;
        chosenGender = container.querySelector('#select-gender').value;
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
                // Skenario darurat jika internet putus/server mati: buat respon lokal di frontend
                aiReply = `That's interesting. Tell me more about it as a ${currentRole}!`;
            } else {
                const data = await res.json();
                aiReply = data.reply || `I see. Tell me more about it!`;
            }

            // Simpan riwayat secara aman berpasangan
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
                        return nameLower.includes('male') || nameLower.includes('david') || nameLower.includes('guy') || nameLower.includes('james');
                    } else {
                        return nameLower.includes('female') || nameLower.includes('zira') || nameLower.includes('hazel') || nameLower.includes('samantha') || nameLower.includes('google us english');
                    }
                }
                return false;
            });

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            
            utterance.onend = () => {
                startListeningSafely();
            };
            
            window.speechSynthesis.speak(utterance);

        } catch(e) {
            console.error("Frontend Error:", e);
            statusTxt.innerText = "🔊 Memutar respon cadangan...";
            setTimeout(startListeningSafely, 2000);
        }
    }

    endBtn.onclick = async () => {
        statusTxt.innerText = "Membuat evaluasi grammar & pronunciation akhir...";
        clearTimeout(silenceTimer);
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
            
            let report;
            if (!res.ok) {
                // Buat laporan simulasi jika server backend mati saat tombol selesai ditekan
                report = {
                    overall: 80, fluency: 80, grammar: 85, pronunciation: 75, vocabulary: 80,
                    mistakes: [{ user: "Contoh kalimatmu", correct: "Contoh kalimat benar", explanation: "Laporan simulasi offline." }]
                };
            } else {
                report = await res.json();
            }
            
            if (window.globalScores && report.overall) {
                window.globalScores.speaking = Math.round(Number(report.overall));
            }

            activeDiv.style.display = 'none';
            reportDiv.style.display = 'block';

            reportDiv.innerHTML = `
                <h3 style="margin-bottom:15px; color:var(--primary-color);">📊 Rapor Evaluasi Akhir</h3>
                <div class="score-badge" style="margin-bottom:15px; display:inline-block; background:#1a73e8; color:#fff; padding:5px 15px; border-radius:20px; font-weight:bold;">Skor Akhir: ${report.overall || 0}</div>
                
                <p><strong>Fluency:</strong> ${report.fluency || 0} | <strong>Grammar:</strong> ${report.grammar || 0}</p>
                <p><strong>Pronunciation:</strong> ${report.pronunciation || 0} | <strong>Vocabulary:</strong> ${report.vocabulary || 0}</p>
                
                <h4 style="color:#ea4335; margin-top:20px;">❌ Analisis Kesalahan:</h4>
                ${(report.mistakes || []).map(m => `
                    <div class="eval-section" style="border-left:3px solid red; padding-left:10px; margin-bottom:10px; background:#fff5f5;">
                        <p style="color:red; margin:2px 0;">Kamu: "${m.user}"</p>
                        <p style="color:green; margin:2px 0;">Benar: "${m.correct}"</p>
                        <p style="margin:2px 0;"><small>Info: ${m.explanation}</small></p>
                    </div>
                `).join('')}
                
                <button onclick="window.location.reload()" class="action-btn" style="margin-top:20px;">Selesai</button>
            `;
        } catch(err) {
            console.error("Error Rapor:", err);
            alert("Sesi latihan selesai.");
            window.location.reload();
        }
    };
}
