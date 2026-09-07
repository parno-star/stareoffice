import PricingPlanPdfDownload from "../landing/_components/PricingPlanPdfDownload.tsx";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft } from "lucide-react";

export default function DownloadPricingPdf() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Rekomendasi Paket HRIS
          </h1>
          <p className="text-sm text-muted-foreground">
            Download dokumen PDF berisi rekomendasi lengkap struktur paket, fitur inti, fitur non-inti, dan filosofi setiap tier.
          </p>
        </div>
        <PricingPlanPdfDownload />
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer gap-2 text-muted-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
}
