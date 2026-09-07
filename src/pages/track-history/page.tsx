import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import {
  History,
  BarChart3,
  Calculator,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import HistoryList from "./_components/HistoryList.tsx";
import TrackCharts from "./_components/TrackCharts.tsx";

type Tab = "history" | "charts";

export default function TrackHistoryPage() {
  const [tab, setTab] = useState<Tab>("history");
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-20 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/track-calculator")}
              className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-muted hover:bg-muted/70 transition-colors"
            >
              <ArrowLeft className="size-5 text-muted-foreground" />
            </button>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <History className="size-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Riwayat & Visualisasi
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Data historis perhitungan kelas jalan rel dan analisis visual
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="cursor-pointer gap-1.5"
          onClick={() => navigate("/track-calculator")}
        >
          <Calculator className="size-4" />
          Kalkulator
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1.5">
        <button
          onClick={() => setTab("history")}
          className={cn(
            "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
            tab === "history"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <History className="size-4" />
          Riwayat Perhitungan
        </button>
        <button
          onClick={() => setTab("charts")}
          className={cn(
            "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
            tab === "charts"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="size-4" />
          Visualisasi Data
        </button>
      </div>

      {/* Content */}
      {tab === "history" && <HistoryList />}
      {tab === "charts" && <TrackCharts />}
    </div>
  );
}
