export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan.' });

    const keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean);
    if (keys.length === 0) return res.status(500).json({ error: "API Keys tidak ditemukan." });

    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    // Menggunakan model yang dijamin stabil & cepat
    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];

    const { theme } = req.body || {};
    const selectedTheme = theme || "General English Conversation";
    const seed = Date.now() + "_" + Math.floor(Math.random() * 10000);

    const prompt = `You are an expert Islamic studies lecturer and English test developer.
Generate EXACTLY 10 multiple-choice English listening comprehension questions for students studying the topic: "${selectedTheme}".
Randomization Seed: ${seed}.

Each item must have:
- transcript: A short natural English conversation or passage (2-4 lines) strictly related to ${selectedTheme}.
- question: Clear comprehension question in English.
- options: 4 distinct choices in English.
- answer: The exact text of the correct choice.
- explanation: A helpful explanation in Bahasa Indonesia.

OUTPUT FORMAT (STRICT VALID JSON, NO MARKDOWN WRAPPER):
{
  "theme": "${selectedTheme}",
  "items": [
    {
      "id": 1,
      "transcript": "Student A: Have you revised the rules of Fiqh regarding Wudu?\\nStudent B: Yes, we must ensure water touches all required parts as prescribed in the Quran.",
      "question": "What topic are the students discussing?",
      "options": ["Rules of Wudu in Fiqh", "Pillars of Zakat", "History of Islamic Golden Age", "Methods of Reciting Hadith"],
      "answer": "Rules of Wudu in Fiqh",
      "explanation": "Para santri/mahasiswa sedang mendiskusikan aturan wudhu sesuai hukum Fikih."
    }
  ]
}`;

    let lastError = null;

    for (const modelName of models) {
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        responseMimeType: "application/json",
                        temperature: 0.7 
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || `API Error HTTP ${response.status}`);
            }

            const data = await response.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error("Respons AI kosong.");

            rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const firstOpen = rawText.indexOf('{');
            const lastClose = rawText.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                rawText = rawText.substring(firstOpen, lastClose + 1);
            }

            const parsedData = JSON.parse(rawText);
            if (!parsedData.items || parsedData.items.length === 0) {
                throw new Error("Format JSON tidak valid atau items kosong.");
            }

            return res.status(200).json(parsedData);

        } catch (err) {
            lastError = err.message;
            console.warn(`Listening API (${modelName}) Warning:`, err.message);
        }
    }

    console.error("Listening API All Models Failed. Generating Dynamic Islamic Fallback. Error:", lastError);

    // =========================================================================
    // SMART DYNAMIC FALLBACK: Membuat 10 Soal Relevan Sesuai Tema Pilihan
    // (Aman jika terjadi kendala jaringan/API Key)
    // =========================================================================
    const fallbackBank = generateSmartFallback(selectedTheme);
    return res.status(200).json({
        theme: selectedTheme,
        items: fallbackBank
    });
}

// Fungsi Pembuat Soal Cadangan Cerdas Sesuai Tema
function generateSmartFallback(themeName) {
    const isIslamic = /quran|hadis|fikih|kitab|nahwu|akhlak|tarikh|dakwah|pesantren|muamalah/i.test(themeName);
    
    if (isIslamic) {
        return [
            { id: 1, transcript: "Ustadz: Remember to check the grammatical signs of I'rab in this sentence.\nSantri: Yes Ustadz, this noun ends with Dhommah because it is Marfu'.", question: "What subject of Arabic grammar are they discussing?", options: ["The rules of I'rab and Dhommah", "The history of Arabic poetry", "Rules of Tajwid recitation", "Types of Arabic calligraphy"], answer: "The rules of I'rab and Dhommah", explanation: "Mereka mendiskusikan kaidah I'rab dan tanda Dhommah dalam Nahwu/Shorof." },
            { id: 2, transcript: "Student A: Which chapter of Fiqh are we reading today?\nStudent B: We are studying the chapter on Muamalah and Islamic trade ethics.", question: "What chapter of Fiqh is being studied?", options: ["Muamalah and trade ethics", "Pillars of Hajj", "Procedures of Janazah prayer", "Rules of fasting in Ramadan"], answer: "Muamalah and trade ethics", explanation: "Materi Fikih yang dipelajari adalah bab Muamalah dan etika perdagangan." },
            { id: 3, transcript: "Teacher: Why is learning Islamic History important for us?\nStudent: Because it teaches us how classical scholars built civilization with wisdom.", question: "What is the main benefit of studying Tarikh (Islamic History)?", options: ["Learning lessons from classical scholars", "Memorizing Arabic vocabulary", "Practicing public speaking", "Calculating zakat shares"], answer: "Learning lessons from classical scholars", explanation: "Mempelajari Tarikh memberikan pelajaran tentang hikmah perjuangan ulama klasik." },
            { id: 4, transcript: "Santri A: What time is the congregational Asr prayer at the mosque?\nSantri B: It starts at 3:15 PM right after the first Adhan.", question: "When does the congregational prayer start?", options: ["At 3:15 PM", "At 3:30 PM", "At 4:00 PM", "At 2:45 PM"], answer: "At 3:15 PM", explanation: "Shalat berjamaah dimulai pukul 3:15 sore." },
            { id: 5, transcript: "Lecturer: In Sciences of Quran, what does Makhraj mean?\nStudent: It refers to the correct articulation point of an Arabic letter.", question: "What is the definition of Makhraj?", options: ["Articulation point of an Arabic letter", "Grammatical analysis of a verse", "Translation of the Quran text", "Rules of congregational prayer"], answer: "Articulation point of an Arabic letter", explanation: "Makhraj adalah tempat keluarnya bunyi huruf Hijaiyah yang benar." },
            { id: 6, transcript: "Student A: How do santri practice good manners towards their teachers?\nStudent: By listening attentively and speaking with humility.", question: "According to the passage, how should students show good manners (Adab)?", options: ["By listening attentively and speaking humbly", "By coming late to the class", "By arguing during discussions", "By avoiding homework tasks"], answer: "By listening attentively and speaking humbly", explanation: "Adab santri ditunjukkan dengan menyimak penuh perhatian dan bersikap tawadhu." },
            { id: 7, transcript: "Speaker A: What is the primary source of Islamic Jurisprudence?\nSpeaker B: The Holy Quran, followed by the authentic Sunnah of Prophet Muhammad.", question: "What are the primary sources mentioned?", options: ["The Quran and Authentic Sunnah", "Opinion of modern books", "Local traditions and customs", "Personal logical guessing"], answer: "The Quran and Authentic Sunnah", explanation: "Sumber utama hukum Islam adalah Al-Qur'an dan Sunnah/Hadits shahih." },
            { id: 8, transcript: "Teacher: Please open your Kitab and turn to page twenty-five.\nStudent: Should we read the Matan or the commentary first?", question: "What page did the teacher ask students to open?", options: ["Page twenty-five (25)", "Page thirty-five (35)", "Page fifteen (15)", "Page fifty (50)"], answer: "Page twenty-five (25)", explanation: "Ustadz meminta membuka kitab halaman 25." },
            { id: 9, transcript: "Ustaz: In Da'wah, wisdom and gentle speech are essential.\nSantri: True, as Allah commands us to call people with wisdom and good counsel.", question: "What is essential when performing Da'wah?", options: ["Wisdom and gentle speech", "Force and anger", "Financial wealth", "Speaking very fast"], answer: "Wisdom and gentle speech", explanation: "Dakwah harus disampaikan dengan hikmah dan perkataan yang lembut/santun." },
            { id: 10, transcript: "Santri A: Where are you going after the evening Mujahadah?\nSantri B: I am heading to the Pesantren library to review my lecture notes.", question: "Where is Santri B going?", options: ["To the Pesantren library", "To the sports field", "To the dining hall", "To the market outside"], answer: "To the Pesantren library", explanation: "Santri tersebut hendak menuju perpustakaan pesantren." }
        ];
    } else {
        // Fallback untuk Tema Akademik & Umum
        return [
            { id: 1, transcript: "Professor: Your research proposal needs a clearer methodology section.\nStudent: I will revise the qualitative data analysis part by tomorrow.", question: "What section needs improvement in the research proposal?", options: ["The methodology section", "The front cover page", "The table of contents", "The final conclusion"], answer: "The methodology section", explanation: "Dosen meminta perbaikan pada bagian metodologi penelitian." },
            { id: 2, transcript: "Student A: Is the academic seminar scheduled for Wednesday or Thursday?\nStudent B: It will be held on Thursday morning at 9:00 AM in the auditorium.", question: "When will the academic seminar take place?", options: ["Thursday at 9:00 AM", "Wednesday at 9:00 AM", "Friday afternoon", "Monday morning"], answer: "Thursday at 9:00 AM", explanation: "Seminar akademik dilaksanakan hari Kamis pukul 09.00 WIB." },
            { id: 3, transcript: "Officer: Could you please submit your travel passport and boarding pass?\nPassenger: Here they are. Which gate should I go to for departure?", question: "What document did the officer request?", options: ["Passport and boarding pass", "Student ID card", "Driver's license", "Medical certificate"], answer: "Passport and boarding pass", explanation: "Petugas meminta paspor dan tiket boarding pass." },
            { id: 4, transcript: "Doctor: Make sure to get enough rest and drink plenty of water.\nPatient: Thank you, doctor. How often should I take this medicine?", question: "What advice did the doctor give?", options: ["Get enough rest and drink water", "Avoid sleeping early", "Exercise for five hours daily", "Eat fast food only"], answer: "Get enough rest and drink water", explanation: "Dokter menyarankan istirahat cukup dan banyak minum air putih." },
            { id: 5, transcript: "Manager: Let's discuss the project budget in our next meeting.\nStaff: Sure, I have prepared the financial summary sheet.", question: "What topic will be discussed in the next meeting?", options: ["The project budget", "Office renovation", "Employee vacation", "Marketing logo design"], answer: "The project budget", explanation: "Topik yang akan dibahas adalah anggaran proyek (project budget)." },
            { id: 6, transcript: "Librarian: You can borrow up to three books for two weeks.\nStudent: Perfect, I need these references for my thesis write-up.", question: "How many books can the student borrow?", options: ["Up to three books", "Up to five books", "Only one book", "Ten books"], answer: "Up to three books", explanation: "Siswa boleh meminjam hingga tiga buah buku." },
            { id: 7, transcript: "Woman: Excuse me, does this bus go directly to the university campus?\nDriver: Yes, it is the express line. The journey takes twenty minutes.", question: "How long does the bus journey take?", options: ["Twenty minutes", "Forty minutes", "One hour", "Ten minutes"], answer: "Twenty minutes", explanation: "Perjalanan bus menuju kampus membutuhkan waktu 20 menit." },
            { id: 8, transcript: "Customer: How much is the total for this textbook and notebook?\nClerk: That will be twenty-five dollars in total, sir.", question: "What is the total price?", options: ["Twenty-five dollars ($25)", "Thirty dollars ($30)", "Fifteen dollars ($15)", "Fifty dollars ($50)"], answer: "Twenty-five dollars ($25)", explanation: "Total harga belanjaan adalah 25 dolar." },
            { id: 9, transcript: "Speaker: Technology should be used responsibly to benefit society.\nAudience member: I fully agree, especially in educational fields.", question: "What should technology be used for?", options: ["To benefit society responsibly", "To waste daily time", "To replace human feelings", "To increase prices"], answer: "To benefit society responsibly", explanation: "Teknologi harus digunakan secara bertanggung jawab demi kemaslahatan masyarakat." },
            { id: 10, transcript: "Student A: Did you finish reading chapter four of the textbook?\nStudent B: Not yet, I am currently summarizing chapter three.", question: "What is Student B currently doing?", options: ["Summarizing chapter three", "Reading chapter four", "Writing an exam paper", "Sleeping in class"], answer: "Summarizing chapter three", explanation: "Siswa B sedang membuat rangkuman bab tiga." }
        ];
    }
}
