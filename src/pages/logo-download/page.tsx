import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Download, Check } from "lucide-react";

const LOGO_URL = "https://hercules-cdn.com/file_TYr2Df58nZYpID6x8p76IO6J";

type Variant = { label: string; size: string; url: string; filename: string };

const variants: Variant[] = [
  { label: "Logo Digital (Blue Light)", size: "1024 × 1024 px", url: "https://hercules-cdn.com/file_TYr2Df58nZYpID6x8p76IO6J", filename: "star-eoffice-logo.png" },
];

function DownloadCard({ variant }: { variant: Variant }) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    setDone(false);
    try {
      const res = await fetch(variant.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = variant.filename;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 gap-4">
      <div className="flex items-center gap-3">
        <img src={variant.url} alt={variant.label} className="h-10 w-10 rounded-lg object-contain border" />
        <div>
          <p className="text-sm font-medium">{variant.label}</p>
          <p className="text-xs text-muted-foreground">{variant.size} · PNG</p>
        </div>
      </div>
      <Button size="sm" variant="secondary" onClick={handleDownload} disabled={downloading} className="gap-1.5 shrink-0">
        {done ? <Check className="h-4 w-4 text-green-500" /> : <Download className="h-4 w-4" />}
        {done ? "Tersimpan" : downloading ? "..." : "Unduh"}
      </Button>
    </div>
  );
}

export default function LogoDownloadPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo showcase */}
        <div className="flex flex-col items-center gap-6">
          {/* Light */}
          <div className="rounded-2xl border bg-white p-10 shadow-sm flex items-center justify-center w-full">
            <img src={LOGO_URL} alt="Star e-Office Logo" className="w-32 h-32 object-contain rounded-2xl" />
          </div>
          {/* Dark */}
          <div className="rounded-2xl bg-[#0f172a] p-10 flex items-center justify-center w-full">
            <img src={LOGO_URL} alt="Star e-Office Logo Dark" className="w-32 h-32 object-contain rounded-2xl" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold tracking-tight">Logo Star e-Office</h1>
          <p className="text-sm text-muted-foreground">Pilih ukuran dan unduh</p>
        </div>

        {/* Download options */}
        <div className="space-y-2">
          {variants.map((v) => (
            <DownloadCard key={v.label} variant={v} />
          ))}
        </div>

        {/* Notes */}
        <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Panduan Penggunaan</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>Gunakan pada latar putih atau gelap</li>
            <li>Jangan ubah proporsi atau warna</li>
            <li>Gunakan untuk kop surat, presentasi, materi resmi</li>
          </ul>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Star e-Office — Star Digital Office Platform
        </p>
      </div>
    </div>
  );
}
