import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  ShieldCheck, ShieldX, ShieldAlert, FileText, Calendar, Hash,
  Building2, PenLine, ArrowRight, BadgeCheck, ScanEye,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const TYPE_LABEL: Record<string, string> = {
  masuk: "Surat Masuk",
  keluar: "Surat Keluar",
  internal: "Surat Internal",
  memo: "Nota",
};

const CLASS_LABEL: Record<string, string> = {
  biasa: "Biasa",
  rahasia: "Rahasia",
  sangat_rahasia: "Sangat Rahasia",
  penting: "Penting",
  segera: "Segera",
};

function safeDate(value: string | null, pattern: string): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return format(d, pattern, { locale: localeId });
}

export default function LetterVerifyPage() {
  const params = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const code = useMemo(
    () => (params.code ?? searchParams.get("code") ?? "").trim(),
    [params.code, searchParams],
  );

  const result = useQuery(api.letters.verifyByCode, code ? { code } : "skip");
  const loading = code !== "" && result === undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold">Verifikasi Surat</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Star e-Office</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* No code */}
        {!code && (
          <StatusCard
            tone="warning"
            icon={<ShieldAlert className="size-8" />}
            title="Kode verifikasi tidak ditemukan"
            description="Pindai QR code pada surat resmi untuk memverifikasi keasliannya."
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        )}

        {/* Not found */}
        {code && result && !result.found && (
          <StatusCard
            tone="danger"
            icon={<ShieldX className="size-8" />}
            title="Surat tidak dapat diverifikasi"
            description={`Tidak ada surat resmi dengan kode "${code}" di sistem. Pastikan kode benar atau surat mungkin tidak sah.`}
            code={code}
          />
        )}

        {/* Found */}
        {code && result && result.found && (
          <div className="space-y-4">
            {/* Verdict banner */}
            <div
              className={`rounded-2xl border p-5 ${
                result.isApproved
                  ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/40"
                  : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                    result.isApproved
                      ? "bg-green-600 text-white"
                      : "bg-amber-500 text-white"
                  }`}
                >
                  {result.isApproved ? <ShieldCheck className="size-6" /> : <ShieldAlert className="size-6" />}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-base font-bold ${
                      result.isApproved
                        ? "text-green-800 dark:text-green-300"
                        : "text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {result.isApproved ? "Surat Terverifikasi Asli" : "Surat Terdaftar (Belum Final)"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {result.isApproved
                      ? "Surat ini tercatat resmi dan telah melalui proses persetujuan di sistem."
                      : "Surat ini terdaftar di sistem namun belum menyelesaikan proses persetujuan/pengiriman."}
                  </p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">Kode: {code}</p>
                </div>
              </div>
            </div>

            {/* Peringatan pencocokan: cegah QR yang disalin ke surat palsu */}
            <div className="flex items-start gap-3 rounded-2xl border border-blue-300 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
              <ScanEye className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                  Cocokkan data di bawah dengan surat fisik Anda
                </p>
                <p className="mt-1 text-xs text-blue-700/90 dark:text-blue-300/80">
                  Halaman ini menampilkan data surat <span className="font-semibold">asli</span> yang tercatat di sistem.
                  Pastikan <span className="font-semibold">nomor surat, perihal, tanggal, dan penandatangan</span> di
                  layar ini sama persis dengan surat fisik. Jika berbeda, surat fisik tersebut tidak sah meskipun
                  memiliki QR ini.
                </p>
              </div>
            </div>

            {/* Detail card */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              {result.organizationName && (
                <div className="mb-4 flex items-center gap-2 border-b pb-3">
                  <Building2 className="size-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">{result.organizationName}</p>
                </div>
              )}

              <h1 className="text-lg font-bold leading-snug">{result.subject}</h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{TYPE_LABEL[result.type] ?? result.type}</Badge>
                {result.classification !== "biasa" && (
                  <Badge variant="outline" className="border-red-300 text-red-700 dark:text-red-300">
                    {CLASS_LABEL[result.classification] ?? result.classification}
                  </Badge>
                )}
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailItem icon={<Hash className="size-4" />} label="Nomor Surat" value={result.letterNumber ?? "-"} />
                {result.agendaNumber && (
                  <DetailItem icon={<Hash className="size-4" />} label="Nomor Agenda" value={result.agendaNumber} />
                )}
                <DetailItem
                  icon={<Calendar className="size-4" />}
                  label="Tanggal Surat"
                  value={safeDate(result.letterDate, "d MMMM yyyy")}
                />
                {result.sentAt && (
                  <DetailItem
                    icon={<Calendar className="size-4" />}
                    label="Diterbitkan"
                    value={safeDate(result.sentAt, "d MMMM yyyy, HH:mm")}
                  />
                )}
                <DetailItem icon={<FileText className="size-4" />} label="Dari" value={result.fromName} />
                <DetailItem icon={<ArrowRight className="size-4" />} label="Kepada" value={result.toName} />
              </dl>

              {/* Tanda tangan penandatangan utama + verifikasi keaslian */}
              {result.signer && (result.signer.name || result.signer.signatureImage) && (
                <div className="mt-5 border-t pt-4">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <BadgeCheck className="size-3.5" /> Tanda Tangan Penandatangan
                  </p>
                  {result.signatureMethod === "basah" && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      <PenLine className="mt-0.5 size-4 shrink-0" />
                      <p className="text-xs">
                        Surat ini ditandatangani secara <span className="font-semibold">manual (basah)</span> di luar sistem.
                        Tanda tangan digital tidak ditampilkan; keasliannya tetap dijamin oleh kode verifikasi ini.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
                      {result.signer.signatureImage ? (
                        <img
                          src={result.signer.signatureImage}
                          alt={`Tanda tangan ${result.signer.name ?? ""}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <PenLine className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {result.signer.name ?? "-"}
                      </p>
                      {result.signer.jobTitle && (
                        <p className="truncate text-xs text-muted-foreground">
                          {result.signer.jobTitle}
                        </p>
                      )}
                      {result.signer.department && (
                        <p className="truncate text-xs text-muted-foreground">
                          {result.signer.department}
                        </p>
                      )}
                      {result.signer.nip && (
                        <p className="truncate text-xs text-muted-foreground">
                          NIP. {result.signer.nip}
                        </p>
                      )}
                      {result.isApproved && result.signatureMethod === "basah" && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          <PenLine className="size-3" /> Tanda tangan manual (basah)
                        </span>
                      )}
                      {result.isApproved && result.signatureMethod !== "basah" && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950/60 dark:text-green-300">
                          <ShieldCheck className="size-3" /> Tanda tangan terverifikasi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Signatories */}
              {result.signatories.length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <PenLine className="size-3.5" /> Ditandatangani / Disetujui oleh
                  </p>
                  <div className="space-y-2">
                    {result.signatories.map((s, i) => (
                      <div key={`${s.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          {s.jobTitle && <p className="truncate text-xs text-muted-foreground">{s.jobTitle}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-1 text-green-600 dark:text-green-400">
                          <ShieldCheck className="size-3.5" />
                          <span className="text-[11px]">{safeDate(s.approvedAt, "d MMM yyyy")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.authorName && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Konseptor: <span className="font-medium text-foreground/80">{result.authorName}</span>
                  {result.authorJobTitle ? ` — ${result.authorJobTitle}` : ""}
                </p>
              )}
            </div>

            <p className="px-2 text-center text-xs text-muted-foreground">
              Halaman ini menampilkan data keaslian surat tanpa isi surat demi menjaga kerahasiaan.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium break-words">{value}</dd>
      </div>
    </div>
  );
}

function StatusCard({
  tone,
  icon,
  title,
  description,
  code,
}: {
  tone: "warning" | "danger";
  icon: React.ReactNode;
  title: string;
  description: string;
  code?: string;
}) {
  const toneClasses =
    tone === "danger"
      ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
      : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  return (
    <div className={`rounded-2xl border p-8 text-center ${toneClasses}`}>
      <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-background/60">
        {icon}
      </div>
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="mt-2 text-sm opacity-90">{description}</p>
      {code && <p className="mt-3 font-mono text-xs opacity-70">Kode: {code}</p>}
    </div>
  );
}
