import React, { useState } from "react";
import {
  Layout,
  Globe,
  Mail,
  Phone,
  Save,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { SuperAdminDb, LandingFooter } from "../mockDb";

interface LandingFooterTabProps {
  db: SuperAdminDb;
  onChangeDb: (updated: SuperAdminDb) => void;
}

export default function LandingFooterTab({ db, onChangeDb }: LandingFooterTabProps) {
  const [config, setConfig] = useState<LandingFooter>(db.landingFooter);
  const [isSaved, setIsSaved] = useState(false);

  const handleToggleSection = (key: keyof LandingFooter["landingVisibility"]) => {
    setConfig((prev) => ({
      ...prev,
      landingVisibility: {
        ...prev.landingVisibility,
        [key]: !prev.landingVisibility[key]
      }
    }));
    setIsSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: "Updated Landing Page Visibility & Footer Config",
      organization: "Platform-wide",
      category: "Akses",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      landingFooter: config,
      auditLogs: [newLog, ...db.auditLogs]
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const sections: { key: keyof LandingFooter["landingVisibility"]; label: string; desc: string }[] = [
    { key: "hero", label: "Hero Banner", desc: "Tampilan judul utama, call-to-action utama, dan ilustrasi e-Office" },
    { key: "stats", label: "Ringkasan Statistik", desc: "Metrik pencapaian (jumlah pengguna, dokumen terproses, kepuasan)" },
    { key: "features", label: "Fitur Unggulan", desc: "Penjelasan keunggulan digitalisasi persuratan dan kehadiran" },
    { key: "benefits", label: "Manfaat Perusahaan", desc: "Efisiensi biaya, kecepatan birokrasi, dan transparansi data" },
    { key: "modules", label: "Modul Utama Aplikasi", desc: "Daftar modul Surat Masuk/Keluar, Naskah Dinas, Presensi, Payroll, dll" },
    { key: "workflow", label: "Alur Kerja Sistem", desc: "Langkah-langkah pembuatan, verifikasi, hingga ttd elektronik" },
    { key: "pricing", label: "Tabel Harga / Lisensi", desc: "Komparasi Paket Free, Poc, dan Enterprise" },
    { key: "testimonials", label: "Testimoni Klien", desc: "Ulasan dari pimpinan dan pengguna organisasi" },
    { key: "cta", label: "Banner Pengajuan Trial", desc: "Ajak registrasi dan konsultasi gratis" },
    { key: "footer", label: "Footer Informasi", desc: "Seksi kontak, alamat kantor, dan tautan kebijakan" }
  ];

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* SECTION 1: VISIBILITAS SEKSI LANDING PAGE */}
      <div className="space-y-4" id="section-visibility">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              Visibilitas Seksi Landing Page Platform
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aktifkan atau sembunyikan komponen landing page publik secara fleksibel tanpa mengubah kode.
            </p>
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Save className="size-4" />
            Simpan Konfigurasi
          </button>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="size-4 text-emerald-600" />
            Konfigurasi landing page dan footer berhasil disimpan!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map(({ key, label, desc }) => {
            const isVisible = config.landingVisibility[key];
            return (
              <div
                key={key}
                onClick={() => handleToggleSection(key)}
                className={`p-4 rounded-xl border bg-card cursor-pointer transition-all flex items-center justify-between ${
                  isVisible ? "border-primary/40 bg-primary/5" : "opacity-60 hover:opacity-100"
                }`}
              >
                <div className="space-y-0.5 pr-4">
                  <span className="font-semibold text-xs text-foreground block">{label}</span>
                  <span className="text-[11px] text-muted-foreground block">{desc}</span>
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    isVisible ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: INFORMASI FOOTER & KONTAK PUBLIK */}
      <div className="space-y-4" id="footer-contact-info">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Layout className="size-5 text-muted-foreground" />
            Informasi Teks Footer & Kontak Resmi
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atur pesan pembuka footer serta alamat email dan telepon support yang tampil bagi publik.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-muted-foreground">Deskripsi Singkat Footer</label>
            <textarea
              rows={3}
              value={config.footerText}
              onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Mail className="size-3" /> Email Support Publik
              </label>
              <input
                type="email"
                value={config.contactEmail}
                onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Phone className="size-3" /> No. Telepon Support
              </label>
              <input
                type="text"
                value={config.contactPhone}
                onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
