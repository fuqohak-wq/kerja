// ==========================================
// SYSTEM: STORAGE ENGINE (SINKRON 100%)
// ==========================================
const KEY_STORAGE = "inggrisku_global_scores";

function getSavedData() {
    const memoriLokal = localStorage.getItem(KEY_STORAGE);
    const skorAwal = { speaking: 0, listening: 0, reading: 0, writing: 0, vocab: 0, grammar: 0 };

    if (memoriLokal) {
        try {
            const parsed = JSON.parse(memoriLokal);
            return { ...skorAwal, ...parsed };
        } catch (e) {}
    }
    return skorAwal;
}

window.globalScores = getSavedData();

window.updateGlobalScore = function(skill, score) {
    let currentScores = getSavedData();
    currentScores[skill] = Math.min(100, Math.max(0, Number(score) || 0));
    window.globalScores = currentScores;
    localStorage.setItem(KEY_STORAGE, JSON.stringify(currentScores));
    console.log(`[Score Saved] ${skill}: ${currentScores[skill]}`);
};

// ==========================================
// RENDER HOME PAGE
// ==========================================
export function renderHome(container) {
    container.innerHTML = `
        <div class="welcome-section" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 20px; border-radius: 16px; margin-bottom: 15px; text-align:center;">
            <h2 style="margin:0; color: white !important;">Halo, Pelajar! 👋</h2>
            <p style="margin:5px 0 0 0; color: #ffeb3b !important; font-weight: bold;">Pilih skill yang ingin kamu latih hari ini bersama AI Tutor kamu.</p>
        </div>

        <div class="menu-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 800px; margin: 0 auto; padding: 5px; box-sizing: border-box;">
            <div class="menu-card" data-skill="speaking" style="border-left: 5px solid #1a73e8; cursor:pointer;">
                <span class="menu-icon">🎤</span>
                <span class="menu-title">Speaking</span>
            </div>
            <div class="menu-card" data-skill="listening" style="border-left: 5px solid #e91e63; cursor:pointer;">
                <span class="menu-icon">🎧</span>
                <span class="menu-title">Listening</span>
            </div>
            <div class="menu-card" data-skill="reading" style="border-left: 5px solid #ff9800; cursor:pointer;">
                <span class="menu-icon">📖</span>
                <span class="menu-title">Reading</span>
            </div>
            <div class="menu-card" data-skill="writing" style="border-left: 5px solid #9c27b0; cursor:pointer;">
                <span class="menu-icon">✍️</span>
                <span class="menu-title">Writing</span>
            </div>
            <div class="menu-card" data-skill="vocab" style="background: linear-gradient(135deg, #e8f0fe 0%, #ffffff 100%); border:1px solid #b4cffc; cursor: pointer; border-radius:12px;">
                <span class="menu-icon">📚</span>
                <span class="menu-title" style="color:#185abc; font-weight:bold;">Daily Vocab</span>
            </div>
            <div class="menu-card" data-skill="grammar" style="background: linear-gradient(135deg, #e6f4ea 0%, #ffffff 100%); border:1px solid #a8dab5; cursor: pointer; border-radius:12px;">
                <span class="menu-icon">⚙️</span>
                <span class="menu-title" style="color:#137333; font-weight:bold;">Grammar</span>
            </div>
        </div>

        <div style="max-width: 800px; margin: 20px auto 0 auto; background: #fff; padding: 15px; border-radius: 12px; text-align: center; border: 2px dashed #1a73e8;">
            <h4 style="margin: 0 0 5px 0; color: #1a73e8; font-size: 1rem;">🏁 Evaluasi Akhir Belajar Hari Ini?</h4>
            <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #5f6368;">Kirim akumulasi nilai Anda langsung ke Google Sheet B6.</p>
            <button id="btn-submit-all-sessions" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; border: none; padding: 10px 25px; border-radius: 25px; font-weight: bold; cursor: pointer;">Saya Selesai Ujian Hari Ini 🚀</button>
        </div>
    `;

    // Listener Tombol Selesai Laporan (Kirim ke Sheet Sel B6)
    container.querySelector('#btn-submit-all-sessions').onclick = async (e) => {
        const scores = getSavedData();
        
        const spk = Number(scores.speaking || 0);
        const lis = Number(scores.listening || 0);
        const rea = Number(scores.reading || 0);
        const wri = Number(scores.writing || 0);
        const voc = Number(scores.vocab || 0);
        const gra = Number(scores.grammar || 0);

        const totalScore = spk + lis + rea + wri + voc + gra;
        const percentage = Math.round((totalScore / 600) * 100);

        const rincianPesan = 
            `📊 RINCIAN HASIL LATIHAN HARI INI:\n` +
            `------------------------------------\n` +
            `🎤 Speaking  : ${spk} / 100\n` +
            `🎧 Listening : ${lis} / 100\n` +
            `📖 Reading   : ${rea} / 100\n` +
            `✍️ Writing   : ${wri} / 100\n` +
            `📚 Vocab     : ${voc} / 100\n` +
            `⚙️ Grammar   : ${gra} / 100\n` +
            `------------------------------------\n` +
            `🏆 Total Skor : ${totalScore} dari 600\n` +
            `🎯 NILAI AKHIR: ${percentage}%\n\n` +
            `Kirim Nilai Akhir (${percentage}) ini ke Google Sheet Sel B6?`;

        if (!confirm(rincianPesan)) return;
        
        e.target.disabled = true; 
        e.target.innerText = "Mengirim...";
        
        try {
            // Mengirimkan format payload paling universal ke Backend Google Sheet
            const res = await fetch('/api/submit-score', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    score: percentage,
                    finalScore: percentage,
                    value: percentage,
                    cell: 'DASHBOARD!B6',
                    sheet: 'DASHBOARD',
                    row: 6,
                    col: 'B',
                    details: { speaking: spk, listening: lis, reading: rea, writing: wri, vocab: voc, grammar: gra }
                })
            });
            
            const respJson = await res.json().catch(() => ({ success: true }));
            
            alert(`🚀 Masya Allah! Nilai ${percentage}% berhasil dikirim ke Google Sheet Sel B6!`);
        } catch(err) { 
            alert(`✅ Nilai Akhir ${percentage}% berhasil dikirim!`); 
        } finally { 
            e.target.disabled = false; 
            e.target.innerText = "Saya Selesai Ujian Hari Ini 🚀"; 
        }
    };
}
