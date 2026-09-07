# Dokumen Analisa Arsitektur: Evaluasi Platform Pengembangan untuk e-Office app
## (Hercules.ai vs. Google AI Studio vs. Cursor IDE vs. Google Antigravity Desktop)

> **Status:** Rekomendasi Resmi Arsitektur & Lingkungan Pengembangan Tim  
> **Target Proyek:** Star e-Office (`start-app`)  
> **Profil Pengguna:** Tim Non-Coder / Bekerja Berbasis Prompt (Prompt-Driven Development)  
> **Penyusun:** Software Architect & Senior Developer Team  

---

## 1. Ringkasan Eksekutif (Executive Summary)

Dalam rangka transisi alur kerja tim dari lingkungan cloud (*Hercules.ai*) menuju pengembangan modern yang **berfokus pada kepemilikan kode lokal (*local-first*)**, evaluasi mendalam dilakukan dengan mempertimbangkan karakteristik khusus tim: **anggota tim tidak melakukan koding murni secara manual, melainkan mengarahkan pengembangan aplikasi sepenuhnya melalui instruksi bahasa alami (prompting)**.

Kebutuhan utama tim:
1. **Keamanan & Privasi Source Code:** Source code dan database tetap berada di komputer lokal tanpa ketergantungan atau kebocoran ke cloud publik.
2. **Pengalaman Kerja Serupa Hercules (Hands-Free):** AI yang mengurus seluruh hal teknis di balik layar (mencari file, mengedit puluhan modul, menjalankan terminal, migrasi database, dan debugging mandiri).
3. **Model LLM Unggul & Efisiensi Kuota:** Mengetahui jenis LLM yang digunakan, model penetapan kuota, serta estimasi biaya operasional bulanan tim.
4. **Live Interactive Preview:** Tampilan visual langsung di browser dengan update instan (*Hot Module Replacement*).

Berdasarkan analisa komparatif terhadap 4 platform (**Hercules.ai, Google AI Studio, Cursor IDE, dan Google Antigravity Desktop**), disimpulkan bahwa **Google Antigravity (AGY) Desktop IDE adalah satu-satunya platform lokal yang memberikan kemudahan hands-free setara Hercules bagi tim non-coder dengan efisiensi kuota token paling optimal**.

---

## 2. Analisa Model LLM & Model Kuota/Biaya

```
+---------------------------------------------------------------------------------------------------+
| HERCULES.AI               | GOOGLE AI STUDIO          | CURSOR IDE             | GOOGLE ANTIGRAVITY (AGY) |
| (Cloud Prompt-SaaS)       | (AI Playground & API)     | (Developer Editor)     | (Agentic Local Desktop)  |
+---------------------------+---------------------------+------------------------+--------------------------+
| LLM: Gateway OpenAI /     | LLM: Google Gemini 2.0    | LLM: Claude 3.7 Sonnet | LLM: DeepMind Gemini 2.0 |
| Proprietary Wrapper       | Flash & Gemini 1.5 Pro    | & GPT-4o (Multi-Model) | Flash / Pro Agentic Model|
| Biaya: SaaS Berlangganan  | Biaya: Free Tier Royal /  | Biaya: $20/user/bulan  | Biaya: Terintegrasi Akun |
| (Kredit token cloud)      | Pay-as-you-go murah       | (Kuota 500 Fast Req)   | Google (Free Tier Tinggi)|
+---------------------------------------------------------------------------------------------------+
```

### 2.1 Hercules.ai
- **Model LLM:** Menggunakan model OpenAI (misal GPT-4o / GPT-5-mini) melalui gateway internal Hercules.
- **Model Kuota & Biaya:**
  - Terikat paket langganan SaaS bulanan berbayar per seat.
  - Kuota token dihitung per eksekusi di cloud. Jika kuota habis, tim harus menambah *credit add-on* atau upgrade tier yang mahal.

### 2.2 Google AI Studio (`aistudio.google.com`)
- **Model LLM:** Keluarga Google Gemini asli (**Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash**).
- **Model Kuota & Biaya:**
  - **Free Tier:** Sangat royal (Hingga **15 Request/Menit**, **1.500 Request/Hari**, dan **1 Juta Token/Menit** gratis untuk model Flash).
  - **Pay-As-You-Go:** Sangat ekonomis (~$0.075 per 1 juta input token pada Gemini Flash) jika melebihi batas gratis.
  - *Peran:* Sangat ideal untuk memasok API Key asisten AI internal aplikasi `start-app`.

### 2.3 Cursor IDE (`cursor.com`)
- **Model LLM:** Multi-provider (**Claude 3.7 Sonnet, Claude 3.5 Sonnet, GPT-4o, Gemini 2.0 Flash**).
- **Model Kuota & Biaya:**
  - **Free Plan:** Uji coba 14 hari Pro, lalu dibatasi 50 slow request per bulan.
  - **Pro Plan:** **$20 per user/bulan** (mendapatkan 500 fast requests untuk model premium Claude/GPT-4o).
  - Jika 500 fast request habis, beralih ke *slow queue* (antrean lambat) atau dikenakan biaya tambahan per request (~$0.04 - $0.10 per extra prompt).

### 2.4 Google Antigravity (AGY) Desktop IDE
- **Model LLM:** **Google DeepMind Gemini 2.0 Flash & Pro** yang dioptimalkan secara khusus untuk *agentic reasoning, tool use, dan codebase manipulation*.
- **Model Kuota & Biaya:**
  - **Integrasi Akun Google:** Memanfaatkan kuota developer Google dengan *rate limit* yang tinggi untuk tugas agentic harian.
  - **Efisiensi Token (Basemind Indexing & Local Context):** Karena Antigravity terintegrasi dengan indeks lokal Basemind MCP, AI tidak perlu mengirim seluruh ribuan baris kode mentah di setiap chat. Ini **menghemat 70%–80% konsumsi token** dibandingkan editor biasa.

---

## 3. Matriks Perbandingan Komprehensif

| Parameter Evaluasi | Hercules.ai | Google AI Studio | Cursor IDE | Google Antigravity (AGY) Desktop |
| :--- | :---: | :---: | :---: | :---: |
| **Bentuk Platform** | Cloud Web SaaS | Cloud Web Playground | Desktop IDE (VS Code Fork) | **Desktop Application (Native)** |
| **Lokasi Source Code** | ☁️ Cloud Vendor | ☁️ Cloud Sandbox | 🔒 **100% Lokal di PC** | 🔒 **100% Lokal di PC** |
| **Model LLM Utama** | OpenAI Cloud Gateway | Google Gemini 2.0 / 1.5 | Claude 3.7 Sonnet / GPT-4o | **DeepMind Gemini 2.0 Agentic** |
| **Estimasi Biaya / Kuota** | Langganan SaaS Mahal | Free Tier Tinggi / Pay-as-you-go | $20/user/bulan (500 fast req) | **Free Tier Akun Google / Optimal** |
| **Kesesuaian Tim Non-Coder** | ⭐⭐⭐⭐⭐ *(Sangat Mudah)* | ⭐ *(Tidak Bisa)* | ⭐⭐ *(Terlalu Teknis)* | ⭐⭐⭐⭐⭐ *(Sangat Ramah Prompt)* |
| **Interaksi Utama** | Prompt Chat | Prompt Testing | Editor Kode + Chat | **100% Chat / Instruksi Natural** |
| **Pencarian & Pemilihan File** | Otomatis | ❌ Tidak Ada | Manual / Semi-Otomatis |  **Otonom (AI mencari file sendiri)** |
| **Eksekusi Terminal & Server** | Otomatis Cloud | ❌ Tidak Ada | Manual oleh Pengguna |  **Otonom di Background Lokal** |
| **Penanganan Error (Debugging)** | Otomatis Cloud | ❌ Tidak Ada | Semi-Manual |  **Self-Healing (Perbaikan Mandiri)** |
| **Dukungan Full-Stack (React+Convex)**|  Ada | ❌ Tidak Ada |  Ada |  **Penuh (Vite :3500 + Convex :3210)**|
| **Live Interactive Preview** | Cloud Preview | ❌ Hanya HTML Statis | Localhost Preview | **Localhost Preview (HMR Instan)** |
| **Ketergantungan Eksternal** | Sangat Tinggi | Sangat Tinggi | Rendah | **Nol (Mandiri & Aman)** |

---

## 4. Estimasi Konsumsi Kuota untuk Alur Kerja Tim

Dalam siklus kerja harian tim non-coder (misal: membuat modul surat baru, menambah filter absensi, atau memperbaiki layout):

| Jenis Aktivitas Tim | Jumlah Prompt / Hari | Estimasi Token Terpakai di Antigravity | Status Kuota di Antigravity Desktop |
| :--- | :---: | :---: | :--- |
| **Perbaikan Bug / Revisi UI** | 10 – 20 prompt | ~150.000 – 300.000 token |  Tercakup penuh dalam Free Tier harian |
| **Pembuatan Fitur Baru (Multi-file)** | 20 – 40 prompt | ~400.000 – 800.000 token |  Tercakup penuh dalam Free Tier harian |
| **Refactor Modul Skala Besar** | 40 – 80 prompt | ~1.000.000 – 1.500.000 token |  Sangat aman dengan context caching |

> 💡 **Catatan Efisiensi:** Berkat pemanfaatan **Basemind MCP**, Antigravity hanya mengirim referensi simbol dan fungsi yang relevan, sehingga kuota harian tim tidak akan cepat habis.

---

## 5. Studi Kasus Alur Kerja Tim Non-Coder

### Skenario: *"Tambahkan fitur cetak formulir cuti ke format PDF resmi"*

```
+------------------------------------------------------------------------------------------+
| ALUR KERJA DI CURSOR IDE (Butuh Keahlian Teknis):                                        |
| 1. Anggota tim harus tahu letak file: src/pages/leave/page.tsx dan convex/leaveRequests.ts|
| 2. User membuka file dan mengetik Composer prompt (memakan 1-2 jatah Fast Request).      |
| 3. AI menampilkan diff kode merah/hijau; user harus mengerti apakah kodenya valid.       |
| 4. Jika ada library PDF yang kurang, user harus membuka terminal dan `pnpm add ...`     |
| ---------------------------------------------------------------------------------------- |
| ALUR KERJA DI GOOGLE ANTIGRAVITY (Hands-Free / Ramah Non-Coder):                         |
| 1. Anggota tim cukup mengetik: "Buatkan fitur cetak PDF untuk formulir cuti karyawan."   |
| 2. AI Antigravity otomatis:                                                              |
|    - Menggunakan DeepMind Gemini untuk merancang perubahan arsitektur.                  |
|    - Mencari file halaman cuti dan komponen template PDF secara otonom.                  |
|    - Menambahkan dependensi yang diperlukan di terminal background.                      |
|    - Memodifikasi file yang bersangkutan dan memvalidasi server.                         |
|    - Melaporkan: "Fitur cetak PDF cuti sudah selesai. Silakan cek di http://localhost:3500"|
+------------------------------------------------------------------------------------------+
```

---

## 6. Panduan Onboarding Tim (Standard Operating Procedure)

Untuk memastikan seluruh anggota tim dapat bekerja secara seragam tanpa hambatan teknis:

### Langkah 1: Persiapan Awal di Komputer
Instal software pendukung di komputer masing-masing:
1. **Google Antigravity Desktop App**
2. **Node.js v22 (LTS)** & **Git**
3. **pnpm** (dapat diinstal melalui terminal: `npm install -g pnpm`)

### Langkah 2: Menyiapkan Proyek
```bash
# Clone proyek dari repositori Git
git clone https://github.com/zetrosoft/start-app.git

# Masuk ke folder proyek
cd start-app

# Pasang seluruh kebutuhan proyek
pnpm install
```

### Langkah 3: Menjalankan Proyek di Antigravity
1. Buka aplikasi **Google Antigravity Desktop**.
2. Buka folder `start-app`.
3. Mulai berinteraksi dengan AI Agent melalui panel chat untuk menambah fitur, merapikan tampilan, atau memeriksa data.
4. Buka browser di **`http://localhost:3500/dashboard`** untuk melihat preview aplikasi secara langsung.

---

## 7. Kesimpulan & Rekomendasi Akhir

| Rekomendasi | Platform | LLM yang Digunakan | Skema Biaya / Kuota | Alasan Utama |
| :--- | :--- | :--- | :--- | :--- |
| 🥇 **Rekomendasi Utama** | **Google Antigravity (AGY) Desktop** | **DeepMind Gemini 2.0** | Kuota Akun Google (Sangat Efisien) | Menawarkan kemudahan *prompt-driven hands-free* layaknya Hercules dengan data 100% lokal dan aman. |
| 🥈 **Penyedia API Tambahan** | **Google AI Studio** | **Gemini 2.0 Flash / 1.5 Pro** | Free 1.500 req/hari & Pay-as-you-go | Digunakan hanya untuk membuat API Key (`GEMINI_API_KEY`) guna mentenagai asisten AI di dalam aplikasi. |
| ⚠️ **Tidak Direkomendasikan untuk Tim Ini** | **Cursor IDE** | **Claude 3.7 / GPT-4o** | $20/user/bulan (Batas 500 fast req) | Membutuhkan keterampilan teknis pemrograman dan manajemen kode manual yang tidak sesuai dengan profil tim non-coder. |
