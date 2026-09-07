import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { markInstallComplete } from "@/components/install-gate-guard.tsx";
import {
  Download,
  Smartphone,
  Monitor,
  Shield,
  BookOpen,
  Lock,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useInstallPrompt } from "@/hooks/use-install-prompt.ts";

type DeviceType = "android" | "ios" | "desktop" | "unknown";

function detectDevice(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/windows|macintosh|linux/.test(ua) && !/android/.test(ua))
    return "desktop";
  return "unknown";
}

type ActivePanel = "panduan" | "privasi" | "keamanan" | null;

/** Installation progress steps */
type InstallStep = "ready" | "installing" | "verifying" | "complete" | "timeout";

export default function InstallGatePage() {
  const navigate = useNavigate();
  const { canInstall, isStandalone, isInstalled, promptInstall } =
    useInstallPrompt();
  const [device, setDevice] = useState<DeviceType>("unknown");
  const [installStep, setInstallStep] = useState<InstallStep>("ready");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [gradualProgress, setGradualProgress] = useState(0);

  useEffect(() => {
    setDevice(detectDevice());
    // Auto-hide mobile address bar by scrolling slightly
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 100);
  }, []);

  // If already in standalone mode (opened from PWA icon), skip install page entirely
  useEffect(() => {
    if (isStandalone) {
      markInstallComplete();
      navigate("/", { replace: true });
    }
  }, [isStandalone, navigate]);

  // When app is installed (appinstalled event fired), move to verifying step
  useEffect(() => {
    if (isInstalled && !isStandalone) {
      setInstallStep("verifying");
    }
  }, [isInstalled, isStandalone]);

  // Don't render anything while redirecting in standalone mode
  if (isStandalone) {
    return null;
  }



  const handleInstall = async () => {
    setInstallStep("installing");
    setGradualProgress(5); // Initial feedback
    const success = await promptInstall();
    if (success) {
      setInstallStep("verifying");
      setGradualProgress(10);
      // Poll for standalone mode (icon appearing on screen)
      pollForStandalone();
    } else {
      // User cancelled — back to ready
      setInstallStep("ready");
      setGradualProgress(0);
    }
  };

  const pollForStandalone = () => {
    // Gradual progress: increment every 10s over 90s total (9 steps, capped at 95%)
    let elapsed = 0;
    const progressInterval = setInterval(() => {
      elapsed += 10;
      const percent = Math.min(Math.round((elapsed / 90) * 100), 95);
      setGradualProgress(percent);
      if (elapsed >= 90) {
        clearInterval(progressInterval);
      }
    }, 10000);

    // Check every 1s if app entered standalone mode
    const interval = setInterval(() => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator &&
          (navigator as unknown as { standalone: boolean }).standalone === true);
      if (standalone) {
        clearInterval(interval);
        clearInterval(progressInterval);
        setGradualProgress(100);
        setInstallStep("complete");
      }
    }, 1000);
    // Stop polling after 90s — show "Buka Aplikasi" button
    setTimeout(() => {
      clearInterval(interval);
      clearInterval(progressInterval);
      setGradualProgress(100);
      if (installStep !== "complete") {
        setInstallStep("timeout");
      }
    }, 90000);
  };

  const openPanel = (panel: ActivePanel) => {
    setActivePanel(panel);
  };

  // Calculate progress percentage
  // Use gradual time-based progress during installing/verifying, otherwise step-based
  const isProcessing = installStep === "installing" || installStep === "verifying";
  const displayProgress = isProcessing ? gradualProgress : (installStep === "complete" || installStep === "timeout" ? 100 : 0);

  /** Open the installed PWA via a full page reload so it launches in standalone mode */
  const openInstalledApp = () => {
    markInstallComplete();
    // Full navigation (not SPA) forces the browser to hand off to the installed PWA
    window.location.href = window.location.origin + "/";
  };

  // Full success screen — auto-navigate to app
  if (installStep === "complete") {
    // Auto open app after short delay
    markInstallComplete();
    setTimeout(() => {
      openInstalledApp();
    }, 1500);

    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-6 text-center px-6"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Instalasi Selesai!
          </h2>
          <p className="max-w-xs text-muted-foreground">
            Membuka aplikasi...
          </p>
          {/* Progress bar at 100% */}
          <div className="w-full max-w-xs">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-green-500"
                initial={{ width: "75%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
              100% — Selesai
            </p>
          </div>
          <Button
            size="lg"
            className="w-full max-w-xs cursor-pointer gap-2 text-base font-semibold"
            onClick={openInstalledApp}
          >
            Buka Aplikasi
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex w-full max-w-sm flex-col items-center gap-8"
        >
          {/* App icon with glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl" />
            <motion.img
              src="https://hercules-cdn.com/file_TYr2Df58nZYpID6x8p76IO6J"
              alt="Star e-Office"
              className="relative h-28 w-28 rounded-3xl shadow-2xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            />
          </div>

          {/* Title */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground">
              Instal Star e-Office
            </h1>
            <p className="max-w-xs text-balance text-sm text-muted-foreground">
              Instal aplikasi untuk melanjutkan
            </p>
          </div>

          {/* Progress bar only */}
          <div className="w-full">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
                initial={{ width: 0 }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Install action */}
          <div className="flex w-full flex-col items-center gap-3">
            {installStep === "ready" && canInstall && (
              <Button
                size="lg"
                className="w-full cursor-pointer gap-2 text-base font-semibold shadow-md shadow-primary/20"
                onClick={handleInstall}
              >
                <Download className="h-5 w-5" />
                Instal Sekarang
              </Button>
            )}

            {installStep === "ready" && !canInstall && (
              <Button
                size="lg"
                className="w-full cursor-pointer gap-2 text-base font-semibold shadow-md shadow-primary/20"
                onClick={async () => {
                  setInstallStep("installing");
                  setGradualProgress(5);
                  const success = await promptInstall();
                  if (success) {
                    setInstallStep("verifying");
                    setGradualProgress(10);
                    pollForStandalone();
                  } else {
                    // Fallback: show guide if prompt not available
                    setInstallStep("ready");
                    setGradualProgress(0);
                    openPanel("panduan");
                  }
                }}
              >
                <Download className="h-5 w-5" />
                Instal Aplikasi
              </Button>
            )}

            {installStep === "ready" && (
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  markInstallComplete();
                  navigate("/", { replace: true });
                }}
              >
                Lanjutkan via Browser Web
              </Button>
            )}

            {installStep === "installing" && (
              <Button
                size="lg"
                className="w-full gap-2 text-base font-semibold"
                disabled
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                Menginstal...
              </Button>
            )}

            {installStep === "verifying" && (
              <Button
                size="lg"
                className="w-full gap-2 text-base font-semibold"
                disabled
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                Menunggu...
              </Button>
            )}

            {installStep === "timeout" && (
              <Button
                size="lg"
                className="w-full cursor-pointer gap-2 text-base font-semibold"
                onClick={openInstalledApp}
              >
                Buka Aplikasi
              </Button>
            )}
          </div>
        </motion.div>
      </main>

      {/* Full-screen panel overlay */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col bg-background"
          >
            {/* Panel header */}
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                {activePanel === "panduan" && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <BookOpen className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                {activePanel === "privasi" && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Lock className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                {activePanel === "keamanan" && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Shield className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
                <h2 className="text-lg font-bold text-foreground">
                  {activePanel === "panduan" && "Panduan"}
                  {activePanel === "privasi" && "Kebijakan Privasi"}
                  {activePanel === "keamanan" && "Keamanan"}
                </h2>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Panel content */}
            <div className="flex-1 overflow-auto px-6 py-6">
              <div className="mx-auto max-w-lg">
                {activePanel === "panduan" && (
                  <PanduanContent device={device} />
                )}
                {activePanel === "privasi" && <PrivasiContent />}
                {activePanel === "keamanan" && <KeamananContent />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Installation Progress Indicator                                    */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Panduan Content — all install guides live here                     */
/* ------------------------------------------------------------------ */

function PanduanContent({ device }: { device: DeviceType }) {
  const [expanded, setExpanded] = useState<string | null>(
    device === "ios" ? "ios" : device === "android" ? "android" : "desktop",
  );

  const sections: {
    id: string;
    title: string;
    icon: typeof Smartphone;
    content: ReactNode;
  }[] = [
    {
      id: "ios",
      title: "Instal di iOS (Safari)",
      icon: Smartphone,
      content: <IOSInstructions />,
    },
    {
      id: "android",
      title: "Instal di Android (Chrome)",
      icon: Smartphone,
      content: <AndroidInstructions />,
    },
    {
      id: "desktop",
      title: "Instal di Desktop (Chrome)",
      icon: Monitor,
      content: <DesktopInstructions />,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Pilih panduan sesuai perangkat Anda:
      </p>
      {sections.map((s) => (
        <div
          key={s.id}
          className="overflow-hidden rounded-xl border border-border/60"
        >
          <button
            className="flex w-full cursor-pointer items-center gap-3 bg-muted/30 px-4 py-3.5 text-left transition-colors hover:bg-muted/60"
            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
          >
            <s.icon className="h-4 w-4 text-primary" />
            <span className="flex-1 text-sm font-semibold text-foreground">
              {s.title}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded === s.id ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {expanded === s.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="px-4 py-4">{s.content}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      <div className="mt-2 rounded-xl bg-primary/5 p-4">
        <p className="text-xs font-medium text-primary">
          Tips: Setelah instalasi, buka Star e-Office dari ikon di home screen
          untuk pengalaman terbaik tanpa address bar browser.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Kebijakan Privasi Content                                         */
/* ------------------------------------------------------------------ */

function PrivasiContent() {
  const items = [
    {
      title: "Pengumpulan Data",
      desc: "Kami mengumpulkan data yang diperlukan untuk operasional aplikasi, termasuk informasi profil, email, dan data aktivitas kerja. Semua data dikumpulkan dengan persetujuan pengguna.",
    },
    {
      title: "Penyimpanan Data",
      desc: "Data disimpan di server terenkripsi dengan standar AES-256. Lokasi server berada di data center bersertifikasi internasional dengan uptime 99.9%.",
    },
    {
      title: "Penggunaan Data",
      desc: "Data hanya digunakan untuk menjalankan layanan Star e-Office. Kami tidak menjual, menyewakan, atau membagikan data pribadi kepada pihak ketiga tanpa persetujuan.",
    },
    {
      title: "Hak Pengguna",
      desc: "Pengguna berhak mengakses, mengubah, dan menghapus data pribadinya. Permintaan penghapusan data dapat diajukan melalui admin organisasi atau menghubungi tim support.",
    },
    {
      title: "Cookie & Penyimpanan Lokal",
      desc: "Aplikasi menggunakan cookie dan local storage untuk menyimpan preferensi dan sesi login. Data ini hanya digunakan untuk meningkatkan pengalaman pengguna.",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {items.map((item, i) => (
        <div key={i}>
          <h4 className="mb-1.5 text-sm font-semibold text-foreground">
            {i + 1}. {item.title}
          </h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.desc}
          </p>
        </div>
      ))}
      <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Dengan menginstal dan menggunakan Star e-Office, Anda menyetujui
          kebijakan privasi ini. Kebijakan dapat diperbarui sewaktu-waktu dan
          perubahan akan diinformasikan melalui aplikasi.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Keamanan Content                                                  */
/* ------------------------------------------------------------------ */

function KeamananContent() {
  const features = [
    {
      title: "Enkripsi End-to-End",
      desc: "Semua komunikasi data antara perangkat dan server dilindungi dengan enkripsi SSL/TLS. Data sensitif dienkripsi dengan AES-256.",
    },
    {
      title: "Autentikasi Aman",
      desc: "Sistem login menggunakan protokol OIDC (OpenID Connect) dengan dukungan multi-factor authentication (MFA) melalui Google, Apple, Microsoft, dan email OTP.",
    },
    {
      title: "Role-Based Access Control",
      desc: "Setiap pengguna memiliki peran (role) yang mengatur akses ke fitur dan data. Admin dapat mengonfigurasi hak akses sesuai kebutuhan organisasi.",
    },
    {
      title: "Audit Trail",
      desc: "Semua aktivitas penting dicatat dalam log audit yang dapat ditinjau oleh admin. Termasuk login, perubahan data, dan akses dokumen.",
    },
    {
      title: "Keamanan Infrastruktur",
      desc: "Server di-host di infrastruktur cloud bersertifikasi dengan perlindungan DDoS, firewall berlapis, dan monitoring 24/7.",
    },
    {
      title: "Backup & Recovery",
      desc: "Data di-backup secara berkala untuk memastikan pemulihan cepat jika terjadi gangguan. Prosedur disaster recovery tersedia untuk situasi darurat.",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {features.map((item, i) => (
        <div key={i} className="flex gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {item.title}
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.desc}
            </p>
          </div>
        </div>
      ))}
      <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Star e-Office berkomitmen menjaga keamanan data organisasi Anda.
          Jika menemukan celah keamanan, silakan laporkan ke tim kami.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Installation instruction components                               */
/* ------------------------------------------------------------------ */

function IOSInstructions() {
  const steps = [
    {
      num: 1,
      text: (
        <>
          Ketuk ikon{" "}
          <span className="inline-flex items-center gap-1 font-semibold">
            <Share className="inline h-3.5 w-3.5" /> Share
          </span>{" "}
          di toolbar Safari
        </>
      ),
    },
    {
      num: 2,
      text: 'Gulir ke bawah dan pilih "More" atau "Lainnya"',
    },
    {
      num: 3,
      text: (
        <>
          Ketuk{" "}
          <span className="inline-flex items-center gap-1 font-semibold">
            <PlusSquare className="inline h-3.5 w-3.5" /> Add to Home Screen
          </span>
        </>
      ),
    },
    {
      num: 4,
      text: 'Konfirmasi dengan ketuk "Add"',
    },
  ];

  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step) => (
        <li key={step.num} className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {step.num}
          </span>
          <span className="text-sm leading-relaxed text-foreground">
            {step.text}
          </span>
        </li>
      ))}
    </ol>
  );
}

function AndroidInstructions() {
  const steps = [
    {
      num: 1,
      text: (
        <>
          Ketuk ikon menu{" "}
          <span className="font-semibold">(tiga titik vertikal)</span> di pojok
          kanan atas Chrome
        </>
      ),
    },
    {
      num: 2,
      text: (
        <>
          Pilih{" "}
          <span className="font-semibold">
            &quot;Add to Home Screen&quot;
          </span>{" "}
          atau{" "}
          <span className="font-semibold">&quot;Install app&quot;</span>
        </>
      ),
    },
    {
      num: 3,
      text: (
        <>
          Konfirmasi dengan ketuk{" "}
          <span className="font-semibold">&quot;Install&quot;</span>
        </>
      ),
    },
  ];

  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step) => (
        <li key={step.num} className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {step.num}
          </span>
          <span className="text-sm leading-relaxed text-foreground">
            {step.text}
          </span>
        </li>
      ))}
    </ol>
  );
}

function DesktopInstructions() {
  const steps = [
    {
      num: 1,
      text: (
        <>
          Klik ikon{" "}
          <span className="inline-flex items-center gap-1 font-semibold">
            <Download className="inline h-3.5 w-3.5" /> install
          </span>{" "}
          di address bar browser
        </>
      ),
    },
    {
      num: 2,
      text: (
        <>
          Klik{" "}
          <span className="font-semibold">&quot;Install&quot;</span> pada
          dialog yang muncul
        </>
      ),
    },
    {
      num: 3,
      text: "Aplikasi akan terbuka sebagai window terpisah",
    },
  ];

  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step) => (
        <li key={step.num} className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {step.num}
          </span>
          <span className="text-sm leading-relaxed text-foreground">
            {step.text}
          </span>
        </li>
      ))}
    </ol>
  );
}
