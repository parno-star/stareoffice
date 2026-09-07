# 🏢 Star e-Office (`start-app`)

> **Platform Manajemen Perkantoran Modern, Cerdas, dan Terintegrasi (Enterprise Digital Workplace)**

Star e-Office adalah aplikasi manajemen perkantoran *all-in-one* berbasis cloud-ready dan *local-first* yang dirancang untuk mempercepat birokrasi persuratan, tata kelola SDM (HR), absensi harian, penilaian kinerja (OKR & 360° Review), hingga kolaborasi tim berbasis kecerdasan buatan (*AI Workplace Assistant*).

---

## 🚀 Fitur Utama & Modul

| Kategori Modul | Fitur yang Tersedia |
| :--- | :--- |
| 📬 **Persuratan & Tata Naskah** | Registrasi surat masuk & keluar, penomoran otomatis, verifikasi digital via QR Code, alur disposisi berjenjang, dan arsip digital terpusat. |
| 👥 **SDM & Direktori Organisasi** | Direktori karyawan, bagan struktur organisasi, manajemen departemen & tim, serta profil digital karyawan. |
| ⏱️ **Kehadiran & Cuti** | Absensi harian (*clock-in / clock-out*), rekapitulasi keterlambatan, pengajuan cuti, perhitungan sisa kuota tahunan, dan persetujuan atasan. |
| 🎯 **Kinerja & Sasaran (OKR)** | Manajemen *Objectives & Key Results* (OKR) tingkat perusahaan/tim, evaluasi kinerja berkala (Q1–Q4), dan review 360° feedback. |
| 💬 **Komunikasi & Komunitas** | Pesan langsung (*direct messaging*), forum diskusi internal, jajak pendapat (*polling*), dan kotak saran perusahaan. |
| 💼 **Operasional & Layanan** | Peminjaman ruangan rapat (*room reservation*), tiket bantuan IT/HR (*helpdesk ticketing*), pengajuan perjalanan dinas (*travel request*), dan reimbursement keuangan. |
| 🤖 **Asisten AI Perkantoran** | Chatbot AI cerdas terintegrasi untuk menjawab pertanyaan seputar kebijakan kantor, draft surat, serta ringkasan absensi dan cuti. |

---

## 🛠️ Tech Stack

- **Frontend Framework:** React 19 + TypeScript
- **Bundler & Dev Server:** Vite 6
- **Styling:** Tailwind CSS v4 + Radix UI Primitives + Lucide Icons
- **Backend & Realtime Database:** [Convex](https://convex.dev) (Serverless Realtime Database & Backend Actions)
- **Local Dev Engine:** `convex-local-backend` (Penyimpanan lokal SQLite/Fjall di port `:3210`)
- **Routing & State:** `react-router-dom` v6
- **Architecture Analysis:** Google Antigravity (AGY) & Basemind MCP Integration

---

## 💻 Panduan Menjalankan di Komputer Lokal (Quickstart)

### 1. Prasyarat Sistem
Pastikan komputer Anda telah terpasang:
- **Node.js v22 (LTS)**
- **pnpm** (`npm install -g pnpm`)
- **Git**
- **Google Antigravity Desktop IDE** *(Direkomendasikan untuk tim non-coder)*

### 2. Kloning & Instalasi
```bash
# Clone repositori (default branch: dev)
git clone https://github.com/zetrosoft/start-app.git
cd start-app

# Instalasi seluruh paket dependensi
pnpm install
```

### 3. Menjalankan Aplikasi
```bash
# Menjalankan frontend dev server
pnpm dev
```

Aplikasi frontend akan aktif di:
👉 **`http://localhost:3500`** *(Dashboard: `http://localhost:3500/dashboard`)*

> [!NOTE]
> Backend Convex lokal berjalan di background pada port `3210`. Seluruh autentikasi lokal telah dilengkapi mode bypass pengembang (`Developer Admin` / `PT Star Digital Office`) sehingga siap digunakan langsung tanpa memerlukan setup server cloud eksternal.

---

## 📂 Struktur Direktori

```text
start-app/
├── convex/                   # Backend Convex (Schema, Queries, Mutations, Actions)
│   ├── schema.ts             # Definisi skema database & tabel relasional
│   ├── lib/                  # Helper tenant, auth fallback, dan storage
│   └── *.ts                  # Modul fitur (letters, leave, attendance, users, dll.)
├── docs/                     # Dokumentasi arsitektur & panduan teknis
│   └── ANALYSIS_AISTUDIO_VS_ANTIGRAVITY_DESKTOP.md # Analisa platform pengembangan
├── src/                      # Frontend Source Code
│   ├── components/           # Komponen UI bersama (Dialog, Button, Layout, Gates)
│   ├── pages/                # Halaman aplikasi per modul (Dashboard, Letters, HR, dll.)
│   ├── hooks/                # Custom React Hooks
│   ├── lib/                  # Utilitas frontend & client state
│   ├── App.tsx               # Routing utama aplikasi
│   └── main.tsx              # Entrypoint React 19
├── package.json              # Definisi dependensi dan scripts
└── vite.config.ts            # Konfigurasi Vite dev server (Port 3500)
```

---

## 📖 Dokumentasi Arsitektur untuk Tim

Bagi tim yang ingin mempelajari perbandingan platform pengembangan, efisiensi kuota LLM, dan alur kerja bebas koding murni (*prompt-driven development*), silakan baca:
- 📄 **[Dokumen Analisa Arsitektur: Evaluasi Platform Pengembangan untuk e-Office app](docs/ANALYSIS_AISTUDIO_VS_ANTIGRAVITY_DESKTOP.md)**

---

## 👥 Kontribusi & Standar Kerja Tim

1. Seluruh pengembangan fitur baru dilakukan pada branch **`dev`** atau feature branch turunan (`feat/...`).
2. Jangan menghapus kode asli produksi; simpan kode asli dalam komentar jika menambahkan penyesuaian lokal (`/* --- ORIGINAL PRODUCTION CODE --- */`).
3. Gunakan Bahasa Indonesia yang profesional dan komunikatif untuk setiap dokumentasi dan pesan commit.

---

© 2026 **Zetrosoft & Star Digital Office Team**. All rights reserved.
