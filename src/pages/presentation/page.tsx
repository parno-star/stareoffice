import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Shield,
  ShieldCheck,
  Globe,
  Lock,
  Database,
  Server,
  Cloud,
  Key,
  Eye,
  FileCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Layers,
  Bot,
  Zap,
  Mail,
  ShoppingCart,
  ImageIcon,
  Maximize2,
  Minimize2,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Slide data                                                         */
/* ------------------------------------------------------------------ */

type Slide = {
  id: string;
  title: string;
  subtitle?: string;
  bgImage?: string;
  bgGradient?: string;
  content: React.ReactNode;
};

const ICON_CLASS = "size-6 shrink-0";

function SectionCard({
  icon,
  title,
  items,
  accent = "sky",
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  accent?: string;
}) {
  const accentMap: Record<string, string> = {
    sky: "from-sky-500/20 to-sky-500/5 border-sky-500/30",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/30",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
    fuchsia: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30",
    teal: "from-teal-500/20 to-teal-500/5 border-teal-500/30",
  };
  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br p-4 backdrop-blur-sm",
        accentMap[accent] ?? accentMap.sky,
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold text-white">
        {icon}
        <span>{title}</span>
      </div>
      <ul className="space-y-1 text-sm text-white/80">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex size-10 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/60">{label}</p>
      </div>
    </div>
  );
}

const slides: Slide[] = [
  /* ---- 0  Cover ---- */
  {
    id: "cover",
    title: "",
    bgImage:
      "https://images.unsplash.com/photo-1728739529355-31dcaefd82b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHwxfHxjeWJlcnNlY3VyaXR5JTIwZGlnaXRhbCUyMHNoaWVsZCUyMHRlY2hub2xvZ3klMjBhYnN0cmFjdHxlbnwwfHx8fDE3Nzg3NTQ5NzF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    content: (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-2xl shadow-sky-500/30"
        >
          <Cpu className="size-10 text-white" />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" as const }}
          className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
        >
          Platform Hercules
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" as const }}
          className="mt-3 max-w-2xl text-lg text-white/70 md:text-xl"
        >
          Teknologi AI, Cara Kerja, dan Strategi Keamanan Cyber
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" as const }}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm text-white/80 backdrop-blur-sm"
        >
          Star e-Office &mdash; Presentasi Teknis 2026
        </motion.div>
      </div>
    ),
  },

  /* ---- 1  AI yang digunakan ---- */
  {
    id: "ai-overview",
    title: "Teknologi AI yang Digunakan",
    subtitle: "Model, penyedia, dan integrasi AI di Star e-Office",
    bgGradient: "from-slate-950 via-indigo-950 to-slate-950",
    content: (
      <div className="grid gap-5 md:grid-cols-2">
        <SectionCard
          icon={<Bot className={ICON_CLASS} />}
          title="Model AI"
          accent="violet"
          items={[
            "OpenAI GPT-5 Mini — model cepat & hemat",
            "Diakses via Hercules AI Gateway",
            "Endpoint: ai-gateway.hercules.app/v1",
            "Format model: provider/model-name",
          ]}
        />
        <SectionCard
          icon={<Zap className={ICON_CLASS} />}
          title="Fitur AI Aktif"
          accent="amber"
          items={[
            "Starfa — Asisten AI Chatbot HR",
            "Training AI — rekomendasi & konten belajar",
            "AI Gateway mendukung GPT-5 & Claude Sonnet",
            "Biaya dihitung dari kredit Hercules Cloud",
          ]}
        />
        <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-transparent p-5 md:col-span-2">
          <p className="mb-3 text-sm font-semibold text-violet-300">Arsitektur AI</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/80">
            <span className="rounded-lg bg-violet-500/20 px-3 py-1.5">Frontend React</span>
            <ArrowRight className="size-4 text-violet-400" />
            <span className="rounded-lg bg-violet-500/20 px-3 py-1.5">useAction Hook</span>
            <ArrowRight className="size-4 text-violet-400" />
            <span className="rounded-lg bg-violet-500/20 px-3 py-1.5">Convex Action (Node.js)</span>
            <ArrowRight className="size-4 text-violet-400" />
            <span className="rounded-lg bg-sky-500/20 px-3 py-1.5 font-semibold text-sky-300">Hercules AI Gateway</span>
            <ArrowRight className="size-4 text-violet-400" />
            <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5 font-semibold text-emerald-300">OpenAI GPT-5 Mini</span>
          </div>
        </div>
      </div>
    ),
  },

  /* ---- 2  Cara Kerja Hercules ---- */
  {
    id: "how-it-works",
    title: "Cara Kerja Platform Hercules",
    subtitle: "Semua yang dibutuhkan dalam satu platform terintegrasi",
    bgGradient: "from-slate-950 via-blue-950 to-slate-950",
    content: (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SectionCard
          icon={<Cpu className={ICON_CLASS} />}
          title="1. Bangun Aplikasi"
          accent="sky"
          items={[
            "Chat dengan AI untuk buat halaman & fitur",
            "Dibangun dengan React + TypeScript",
            "Desain responsif otomatis",
          ]}
        />
        <SectionCard
          icon={<Server className={ICON_CLASS} />}
          title="2. Backend & Database"
          accent="violet"
          items={[
            "Convex sebagai backend real-time",
            "Database reaktif (WebSocket)",
            "Sinkronisasi otomatis",
          ]}
        />
        <SectionCard
          icon={<Users className={ICON_CLASS} />}
          title="3. Autentikasi"
          accent="emerald"
          items={[
            "Hercules Auth (OIDC terkelola)",
            "Google, Apple, Microsoft, LinkedIn",
            "Email OTP & SMS OTP",
          ]}
        />
        <SectionCard
          icon={<Globe className={ICON_CLASS} />}
          title="4. Publikasi"
          accent="cyan"
          items={[
            "Satu klik 'Publish' langsung online",
            "Domain gratis *.onhercules.app",
            "Domain kustom tersedia",
          ]}
        />
        <SectionCard
          icon={<Cloud className={ICON_CLASS} />}
          title="5. Hercules Cloud"
          accent="fuchsia"
          items={[
            "Hosting & scaling otomatis",
            "CDN global untuk file & media",
            "Environment dev & production",
          ]}
        />
        <SectionCard
          icon={<Layers className={ICON_CLASS} />}
          title="6. Layanan Bawaan"
          accent="amber"
          items={[
            "AI Gateway, Commerce, Email",
            "Files & Media, Push Notif",
            "PWA untuk install di device",
          ]}
        />
      </div>
    ),
  },

  /* ---- 3  Layanan Terintegrasi ---- */
  {
    id: "services",
    title: "Layanan Terintegrasi Hercules",
    subtitle: "Ekosistem lengkap tanpa setup infrastruktur terpisah",
    bgGradient: "from-slate-950 via-teal-950 to-slate-950",
    content: (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Bot className="size-5 text-violet-400" />}
          label="AI Gateway"
          value="GPT-5"
        />
        <StatCard
          icon={<Database className="size-5 text-sky-400" />}
          label="Database"
          value="Real-time"
        />
        <StatCard
          icon={<Lock className="size-5 text-emerald-400" />}
          label="Auth"
          value="OIDC"
        />
        <StatCard
          icon={<Globe className="size-5 text-cyan-400" />}
          label="Hosting"
          value="Global CDN"
        />
        <StatCard
          icon={<Mail className="size-5 text-amber-400" />}
          label="Email"
          value="Terkelola"
        />
        <StatCard
          icon={<ShoppingCart className="size-5 text-rose-400" />}
          label="Commerce"
          value="Built-in"
        />
        <StatCard
          icon={<ImageIcon className="size-5 text-fuchsia-400" />}
          label="Files & Media"
          value="CDN"
        />
        <StatCard
          icon={<Server className="size-5 text-teal-400" />}
          label="Backend"
          value="Convex"
        />
      </div>
    ),
  },

  /* ---- 4  Keamanan: Autentikasi & Akses ---- */
  {
    id: "security-auth",
    title: "Keamanan: Autentikasi & Akses",
    subtitle: "Sistem login terkelola dan kontrol akses berlapis",
    bgGradient: "from-slate-950 via-emerald-950 to-slate-950",
    content: (
      <div className="grid gap-5 md:grid-cols-2">
        <SectionCard
          icon={<Lock className={ICON_CLASS} />}
          title="Hercules Auth"
          accent="emerald"
          items={[
            "OIDC terkelola — tidak perlu build login sendiri",
            "Multi-provider: Google, Apple, Microsoft, LinkedIn",
            "Email OTP & SMS OTP",
            "Sesi otomatis refresh selama 30 hari aktif",
          ]}
        />
        <SectionCard
          icon={<Shield className={ICON_CLASS} />}
          title="Kontrol Akses"
          accent="sky"
          items={[
            "RBAC — Admin, Superadmin, role kustom",
            "SAML SSO untuk enterprise",
            "SCIM provisioning & deprovisioning",
            "Feature gate per modul/fitur",
          ]}
        />
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 md:col-span-2">
          <p className="mb-2 text-sm font-semibold text-emerald-300">Alur Autentikasi</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/80">
            <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5">User klik Sign In</span>
            <ArrowRight className="size-4 text-emerald-400" />
            <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5">Hercules Auth Portal</span>
            <ArrowRight className="size-4 text-emerald-400" />
            <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5">Pilih Provider</span>
            <ArrowRight className="size-4 text-emerald-400" />
            <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5">Verifikasi</span>
            <ArrowRight className="size-4 text-emerald-400" />
            <span className="rounded-lg bg-sky-500/20 px-3 py-1.5 font-semibold text-sky-300">Token & Session</span>
          </div>
        </div>
      </div>
    ),
  },

  /* ---- 5  Keamanan: Infrastruktur ---- */
  {
    id: "security-infra",
    title: "Keamanan: Infrastruktur & Enkripsi",
    subtitle: "Perlindungan berlapis di level infrastruktur",
    bgGradient: "from-slate-950 via-sky-950 to-slate-950",
    content: (
      <div className="grid gap-5 md:grid-cols-2">
        <SectionCard
          icon={<Globe className={ICON_CLASS} />}
          title="SSL/HTTPS"
          accent="sky"
          items={[
            "Semua koneksi terenkripsi SSL",
            "Domain gratis & kustom dengan HTTPS",
            "CDN terenkripsi (hercules-cdn.com)",
          ]}
        />
        <SectionCard
          icon={<Key className={ICON_CLASS} />}
          title="Secrets Manager"
          accent="violet"
          items={[
            "API key disimpan terpisah & aman",
            "Tidak pernah masuk ke kode",
            "Env terpisah: Development & Production",
          ]}
        />
        <SectionCard
          icon={<Eye className={ICON_CLASS} />}
          title="Security Audit"
          accent="amber"
          items={[
            "Fitur bawaan deteksi kerentanan",
            "Prioritas: Critical, High, Medium, Low",
            "Rekomendasi perbaikan otomatis",
          ]}
        />
        <SectionCard
          icon={<Server className={ICON_CLASS} />}
          title="Rate Limiting & API"
          accent="rose"
          items={[
            "Rate limiting pada AI Gateway",
            "Validasi input ketat di backend",
            "Proteksi terhadap penyalahgunaan",
          ]}
        />
      </div>
    ),
  },

  /* ---- 6  Keamanan: Kepatuhan ---- */
  {
    id: "security-compliance",
    title: "Keamanan: Kepatuhan & Sertifikasi",
    subtitle: "Standar enterprise-grade untuk regulasi ketat",
    bgGradient: "from-slate-950 via-rose-950 to-slate-950",
    content: (
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-transparent p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="size-8 text-emerald-400" />
              <span className="text-xl font-bold text-white">SOC2</span>
            </div>
            <p className="text-sm text-white/70">
              Sertifikasi keamanan, ketersediaan, integritas pemrosesan, kerahasiaan, dan privasi data.
            </p>
          </div>
          <div className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/15 to-transparent p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileCheck className="size-8 text-sky-400" />
              <span className="text-xl font-bold text-white">HIPAA</span>
            </div>
            <p className="text-sm text-white/70">
              Kepatuhan terhadap regulasi perlindungan data kesehatan untuk industri yang membutuhkan.
            </p>
          </div>
        </div>
        <SectionCard
          icon={<Shield className={ICON_CLASS} />}
          title="Fitur Enterprise"
          accent="fuchsia"
          items={[
            "SAML SSO & SCIM provisioning",
            "Kontrak & SLA kustom",
            "KYC untuk Commerce / pembayaran",
            "Ekspor data kapan saja (DB + Media)",
            "On-premise deployment tersedia",
          ]}
        />
      </div>
    ),
  },

  /* ---- 7  Tanggung jawab ---- */
  {
    id: "responsibility",
    title: "Model Tanggung Jawab Keamanan",
    subtitle: "Pembagian tanggung jawab antara Hercules dan pemilik aplikasi",
    bgGradient: "from-slate-950 via-amber-950 to-slate-950",
    content: (
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/15 to-transparent p-5">
          <div className="mb-3 flex items-center gap-2 text-sky-300">
            <Cloud className="size-6" />
            <span className="text-lg font-bold">Dijamin Hercules</span>
          </div>
          <ul className="space-y-2 text-sm text-white/80">
            {[
              "Infrastruktur global & scaling otomatis",
              "SSL/HTTPS untuk semua koneksi",
              "Sistem autentikasi terkelola",
              "SOC2 & HIPAA (Enterprise)",
              "SLA uptime (Commerce Annual & Enterprise)",
              "Security audit bawaan",
              "Rate limiting & proteksi API",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-sky-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-transparent p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-300">
            <Users className="size-6" />
            <span className="text-lg font-bold">Tanggung Jawab Anda</span>
          </div>
          <ul className="space-y-2 text-sm text-white/80">
            {[
              "Menjaga kerahasiaan API key & secrets",
              "Mengatur role/permission dengan benar",
              "Validasi input pengguna",
              "Menjalankan security audit berkala",
              "Memperbaiki temuan critical/high segera",
              "Rutin ekspor data sebagai backup",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },

  /* ---- 8  Catatan Penting ---- */
  {
    id: "notes",
    title: "Catatan Penting",
    subtitle: "Hal-hal yang perlu diperhatikan pengguna platform",
    bgGradient: "from-slate-950 via-rose-950 to-slate-950",
    content: (
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-500/15 to-transparent p-5">
          <Database className="mb-2 size-8 text-rose-400" />
          <h3 className="mb-1 font-semibold text-white">Backup Data</h3>
          <p className="text-sm text-white/70">
            Backup otomatis belum tersedia. Disarankan rutin mengekspor data melalui fitur Export.
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-transparent p-5">
          <Bot className="mb-2 size-8 text-amber-400" />
          <h3 className="mb-1 font-semibold text-white">Akurasi AI</h3>
          <p className="text-sm text-white/70">
            Output AI tidak dijamin 100% akurat. Selalu periksa kembali informasi penting yang dihasilkan AI.
          </p>
        </div>
        <div className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/15 to-transparent p-5">
          <ShieldCheck className="mb-2 size-8 text-sky-400" />
          <h3 className="mb-1 font-semibold text-white">Enterprise</h3>
          <p className="text-sm text-white/70">
            Untuk SLA formal, kontrak kustom, dan kepatuhan ketat, hubungi sales@hercules.app.
          </p>
        </div>
      </div>
    ),
  },

  /* ---- 9  Penutup ---- */
  {
    id: "closing",
    title: "",
    bgImage:
      "https://images.unsplash.com/photo-1755538497211-c4ebc7cc1a94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHwzfHxjeWJlcnNlY3VyaXR5JTIwZGlnaXRhbCUyMHNoaWVsZCUyMHRlY2hub2xvZ3klMjBhYnN0cmFjdHxlbnwwfHx8fDE3Nzg3NTQ5NzF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    content: (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-600 shadow-2xl shadow-sky-500/30"
        >
          <ShieldCheck className="size-10 text-white" />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" as const }}
          className="text-4xl font-bold tracking-tight text-white md:text-5xl"
        >
          Terima Kasih
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" as const }}
          className="mt-3 max-w-xl text-lg text-white/70"
        >
          Platform Hercules menyediakan infrastruktur modern, AI canggih, dan keamanan berlapis untuk mendukung Star e-Office.
        </motion.p>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" as const }}
          className="mt-6 text-sm text-white/50"
        >
          Star e-Office &copy; {new Date().getFullYear()} &mdash; Powered by Hercules
        </motion.p>
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Main Presentation Component                                        */
/* ------------------------------------------------------------------ */

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const total = slides.length;
  const slide = slides[currentSlide];

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev],
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        /* ignore */
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {
        /* ignore */
      });
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div
      className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-950 outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Slide area */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: "easeOut" as const }}
            className="absolute inset-0 flex flex-col"
          >
            {/* BG */}
            {slide.bgImage ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.bgImage})` }}
              >
                <div className="absolute inset-0 bg-black/60" />
              </div>
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-br", slide.bgGradient)} />
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-1 flex-col px-6 py-8 md:px-12 lg:px-20">
              {slide.title ? (
                <div className="mb-6 shrink-0">
                  <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
                    {slide.title}
                  </h2>
                  {slide.subtitle ? (
                    <p className="mt-1.5 text-sm text-white/60 md:text-base">{slide.subtitle}</p>
                  ) : null}
                </div>
              ) : null}
              <div className="flex-1 overflow-y-auto">{slide.content}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="relative z-20 flex items-center justify-between border-t border-white/10 bg-slate-950/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant="ghost"
            className="cursor-pointer text-white/60 hover:bg-white/10 hover:text-white"
            onClick={() => navigate("/dashboard")}
          >
            <Home className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="cursor-pointer text-white/60 hover:bg-white/10 hover:text-white"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
        </div>

        {/* Slide dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                "size-2 cursor-pointer rounded-full transition-all",
                i === currentSlide
                  ? "scale-125 bg-sky-400"
                  : "bg-white/30 hover:bg-white/50",
              )}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-2">
          <span className="mr-2 text-xs text-white/50">
            {currentSlide + 1} / {total}
          </span>
          <Button
            size="icon-sm"
            variant="ghost"
            className="cursor-pointer text-white/60 hover:bg-white/10 hover:text-white"
            onClick={goPrev}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="cursor-pointer text-white/60 hover:bg-white/10 hover:text-white"
            onClick={goNext}
            disabled={currentSlide === total - 1}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
