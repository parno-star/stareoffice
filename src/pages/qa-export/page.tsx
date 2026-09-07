import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Download, FileText } from "lucide-react";

type QA = {
  question: string;
  answer: string[]; // paragraphs
};

const QA_LIST: QA[] = [
  {
    question:
      "Bagaimana cara untuk clone aplikasi yang sudah saya buat dengan maksud agar bisa digunakan oleh organisasi lain berbeda?",
    answer: [
      "Di Hercules ada fitur Fork (duplikat app) yang bisa Anda pakai untuk membuat salinan aplikasi ini agar dipakai organisasi lain.",
      "Cara fork aplikasi di Hercules:",
      "1. Buka halaman Dashboard Hercules (daftar semua app Anda).",
      "2. Pada kartu aplikasi ini, klik menu titik tiga (...).",
      "3. Pilih Fork atau Duplicate.",
      "4. Beri nama baru untuk app salinan (misal: HR Organisasi B).",
      "5. Hercules akan membuat app baru dengan codebase yang sama persis, database Convex kosong (data tidak ikut tersalin), dan subdomain .onhercules.app baru yang terpisah.",
      "Setelah itu organisasi lain bisa login, register user admin mereka, dan mulai pakai aplikasi secara independen.",
      "Hal penting: data tidak ikut ter-clone - ini justru bagus agar organisasi lain mulai dari data kosong. Update fitur tidak otomatis sinkron - kalau Anda ubah app asli, app hasil fork tidak ikut ter-update. Secrets dan domain perlu di-setup ulang di app baru.",
      "Alternatif lebih baik (jika ingin banyak organisasi): kalau rencananya akan dipakai banyak organisasi (3+), lebih baik ubah aplikasi jadi multi-tenant - satu aplikasi melayani banyak organisasi dengan data terpisah. Lebih hemat dan maintenance cuma sekali.",
    ],
  },
  {
    question:
      "Sejauh mana keamanan data terhadap risiko kebocoran data antar organisasi jika menggunakan multi tenant?",
    answer: [
      "Tingkat keamanan multi-tenant",
      "Secara arsitektur, multi-tenant di Hercules sangat aman, karena:",
      "- Isolasi di level aplikasi (backend Convex): setiap query/mutation bisa difilter otomatis berdasarkan organizationId user yang login.",
      "- Autentikasi Hercules Auth: identitas user tidak bisa dipalsukan, tokenIdentifier dijamin valid oleh sistem.",
      "- Data terenkripsi saat transit (HTTPS) dan saat rest (disediakan oleh infrastruktur Convex).",
      "- Tidak ada akses langsung ke database dari frontend - semua harus lewat function backend yang Anda kontrol.",
      "Risiko utama dan mitigasi:",
      "- User A lihat data Organisasi B (query lupa filter organizationId) -> pakai helper requireOrgAccess() di setiap function.",
      "- User pindah organisasi tapi masih lihat data lama (caching, session tidak refresh) -> validasi organizationId di setiap request.",
      "- Admin A akses data Organisasi B lewat ID langsung (endpoint tidak cek kepemilikan resource) -> selalu cek doc.organizationId === user.organizationId.",
      "- Upload file bocor antar org (file storage pakai ID global) -> simpan organizationId di metadata file, cek saat download.",
      "- Super-admin disalahgunakan (role super_admin lintas organisasi) -> pisahkan super_admin (platform) vs org_admin (organisasi).",
      "Level keamanan dibanding opsi lain:",
      "- App terpisah per org (fork): isolasi sangat tinggi (DB fisik beda), risiko kebocoran hampir nol, biaya tinggi.",
      "- Multi-tenant (1 DB, filter by org): isolasi tinggi jika implementasi benar, risiko rendah-sedang, biaya rendah.",
      "- Tanpa filter (salah implementasi): tidak ada isolasi, risiko sangat tinggi.",
      "Cara memastikan keamanan multi-tenant (defense in depth):",
      "1. Helper wajib di setiap backend function - function otomatis tolak request jika organizationId tidak cocok.",
      "2. Middleware validasi di semua query/mutation/action.",
      "3. Audit log - setiap akses data tercatat (siapa, kapan, resource apa).",
      "4. Testing isolasi - sediakan skrip uji yang coba akses data org lain dan memastikan selalu ditolak.",
      "5. Role scoped per organisasi - role hanya berlaku di organisasi user tersebut.",
      "Rekomendasi:",
      "- 2-10 organisasi dengan data sensitif tinggi (misal data keuangan/kepegawaian): multi-tenant tetap aman asalkan implementasi disiplin, ATAU fork app terpisah jika ingin isolasi maksimum.",
      "- 10+ organisasi: multi-tenant hampir pasti lebih baik.",
      "- Data sangat rahasia atau ada regulasi ketat: fork per organisasi paling aman.",
    ],
  },
  {
    question:
      "Seberapa banyak batasan jumlah organisasi yang diberikan Hercules dan seberapa besar kapasitas DB yang disediakan untuk multi tenant?",
    answer: [
      "Jumlah organisasi/tenant",
      "Tidak ada batasan jumlah organisasi di Hercules. Aplikasi bisa skala hingga jutaan pengguna. Organisasi hanyalah data di database Anda, jadi secara teknis tidak dibatasi oleh Hercules.",
      "Kapasitas database (Hercules Database):",
      "- Free: Storage 500 MB, Bandwidth 1 GB/bulan.",
      "- Pro: Storage 25 GB, Bandwidth 25 GB/bulan, biaya kelebihan $0,27/GB.",
      "- Business: Pay-as-you-go, biaya kelebihan $0,035/GB (storage).",
      "Batasan lain yang relevan:",
      "- Function calls/bulan: Free 200 ribu, Pro 5 juta, Business tanpa batas (bayar per pakai).",
      "- File storage: Free 50 MB, Pro 2 GB, Business 20 GB.",
      "- Email/bulan: Free 100, Pro 10.000, Business 100.000.",
      "Estimasi kapasitas per organisasi (plan Pro 25 GB):",
      "- 10 organisasi = ~2,5 GB per organisasi (sangat cukup untuk ratusan karyawan).",
      "- 50 organisasi = ~500 MB per organisasi (cukup untuk HR app dengan data teks).",
      "- 100 organisasi = ~250 MB per organisasi (masih cukup jika tidak banyak file).",
      "Untuk aplikasi HR seperti ini (kebanyakan data teks, sedikit file), 25 GB bisa menampung 50-100+ organisasi menengah tanpa kelebihan.",
      "Kesimpulan:",
      "- Tidak ada batas teknis jumlah organisasi dari Hercules.",
      "- Plan Pro cukup untuk puluhan organisasi dengan data normal.",
      "- Jika melebihi kuota, tetap jalan, cuma bayar biaya pay-as-you-go per GB.",
      "- Hercules akan memberi peringatan otomatis saat mendekati limit.",
    ],
  },
];

function generatePdf(): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginTop = 60;
  const marginBottom = 60;
  const maxWidth = pageWidth - marginX * 2;

  let y = marginTop;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Tanya Jawab: Clone Aplikasi & Multi-Tenant", marginX, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Disusun pada ${today}`, marginX, y);
  y += 20;
  doc.setTextColor(0);

  // Divider
  doc.setDrawColor(200);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 20;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  QA_LIST.forEach((qa, idx) => {
    // Question
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    const qLabel = `Pertanyaan ${idx + 1}`;
    ensureSpace(18);
    doc.text(qLabel, marginX, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const qLines = doc.splitTextToSize(qa.question, maxWidth);
    ensureSpace(qLines.length * 14 + 8);
    doc.text(qLines, marginX, y);
    y += qLines.length * 14 + 10;

    // Answer header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    ensureSpace(16);
    doc.text("Jawaban:", marginX, y);
    y += 14;

    // Answer body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);

    qa.answer.forEach((para) => {
      const lines = doc.splitTextToSize(para, maxWidth);
      ensureSpace(lines.length * 13 + 6);
      doc.text(lines, marginX, y);
      y += lines.length * 13 + 6;
    });

    // Separator between QAs
    y += 10;
    if (idx < QA_LIST.length - 1) {
      ensureSpace(20);
      doc.setDrawColor(230);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 18;
    }
  });

  // Footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 24,
      { align: "center" },
    );
  }

  return doc;
}

export default function QaExportPage() {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    const doc = generatePdf();
    doc.save("tanya-jawab-clone-multi-tenant.pdf");
    setDownloaded(true);
  };

  // Auto-download once on mount for convenience
  useEffect(() => {
    handleDownload();
  }, []);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Unduh Tanya Jawab (PDF)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            File PDF berisi tiga tanya jawab seputar cara clone aplikasi,
            keamanan multi-tenant, dan batasan kapasitas Hercules.
          </p>
          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <ul className="list-disc pl-5">
              <li>Cara clone / fork aplikasi untuk organisasi lain</li>
              <li>Keamanan data & risiko kebocoran pada multi-tenant</li>
              <li>Batasan jumlah organisasi & kapasitas DB Hercules</li>
            </ul>
          </div>
          <Button
            onClick={handleDownload}
            className="cursor-pointer w-fit"
          >
            <Download className="mr-2 h-4 w-4" />
            {downloaded ? "Unduh Ulang PDF" : "Unduh PDF"}
          </Button>
          {downloaded && (
            <p className="text-xs text-muted-foreground">
              PDF sudah otomatis terunduh. Periksa folder unduhan di perangkat
              Anda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
