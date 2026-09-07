import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Train,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Info,
  Gauge,
  Ruler,
  BarChart3,
  FileText,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  RAIL_TYPES,
  SLEEPER_TYPES,
  SLEEPER_LABELS,
  GAUGE_TYPES,
  SUBGRADE_CONDITIONS,
  TRACK_CLASSES_1067,
  TRACK_CLASSES_1435,
  TQI_THRESHOLDS,
} from "./_lib/track-standards.ts";
import type {
  RailType,
  SleeperType,
  GaugeType,
  SubgradeCondition,
} from "./_lib/track-standards.ts";
import { calculateTrackClass } from "./_lib/calculator-engine.ts";
import type { CalculatorInput, CalculatorResult } from "./_lib/calculator-engine.ts";
import ResultPanel from "./_components/ResultPanel.tsx";
import ReferenceTable from "./_components/ReferenceTable.tsx";

type FormStep = "operation" | "infrastructure" | "geometry" | "result";

const STEPS: { key: FormStep; label: string; icon: typeof Train }[] = [
  { key: "operation", label: "Data Operasi", icon: Train },
  { key: "infrastructure", label: "Data Infrastruktur", icon: Ruler },
  { key: "geometry", label: "Data Geometri", icon: Gauge },
  { key: "result", label: "Hasil", icon: BarChart3 },
];

export default function TrackCalculatorPage() {
  const [step, setStep] = useState<FormStep>("operation");
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();
  const saveCalculation = useMutation(api.trackCalculations.save);

  // Form state
  const [segmentName, setSegmentName] = useState("");
  const [staStart, setStaStart] = useState("");
  const [staEnd, setStaEnd] = useState("");

  // Operation
  const [axleLoad, setAxleLoad] = useState("");
  const [designSpeed, setDesignSpeed] = useState("");
  const [trainFrequency, setTrainFrequency] = useState("");
  const [passengerTonnage, setPassengerTonnage] = useState("");
  const [freightTonnage, setFreightTonnage] = useState("");
  const [locomotiveTonnage, setLocomotiveTonnage] = useState("");

  // Infrastructure
  const [gauge, setGauge] = useState<GaugeType>("1067");
  const [railType, setRailType] = useState<RailType>("R54");
  const [sleeperType, setSleeperType] = useState<SleeperType>("beton");
  const [ballastThickness, setBallastThickness] = useState("");
  const [subgrade, setSubgrade] = useState<SubgradeCondition>("baik");

  // Geometry (SD values)
  const [sdAlignment, setSdAlignment] = useState("");
  const [sdLevel, setSdLevel] = useState("");
  const [sdGauge, setSdGauge] = useState("");
  const [sdTwist, setSdTwist] = useState("");

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  function handleCalculate() {
    const input: CalculatorInput = {
      segmentName: segmentName || "Segmen Tanpa Nama",
      staStart: staStart || "-",
      staEnd: staEnd || "-",
      operation: {
        axleLoad: parseFloat(axleLoad) || 0,
        designSpeed: parseFloat(designSpeed) || 0,
        trainFrequency: parseFloat(trainFrequency) || 0,
        passengerTonnageDaily: parseFloat(passengerTonnage) || 0,
        freightTonnageDaily: parseFloat(freightTonnage) || 0,
        locomotiveTonnageDaily: parseFloat(locomotiveTonnage) || 0,
      },
      infrastructure: {
        gauge,
        railType,
        sleeperType,
        ballastThickness: parseFloat(ballastThickness) || 0,
        subgrade,
      },
      geometry: {
        sdAlignment: parseFloat(sdAlignment) || 0,
        sdLevel: parseFloat(sdLevel) || 0,
        sdGauge: parseFloat(sdGauge) || 0,
        sdTwist: parseFloat(sdTwist) || 0,
      },
    };
    const calcResult = calculateTrackClass(input);
    setResult(calcResult);
    setStep("result");
  }

  function handleReset() {
    setStep("operation");
    setResult(null);
    setIsSaved(false);
  }

  async function handleSave() {
    if (!result) return;
    setIsSaving(true);
    try {
      await saveCalculation({
        segmentName: segmentName || "Segmen Tanpa Nama",
        staStart: staStart || "-",
        staEnd: staEnd || "-",
        input: {
          operation: {
            axleLoad: parseFloat(axleLoad) || 0,
            designSpeed: parseFloat(designSpeed) || 0,
            trainFrequency: parseFloat(trainFrequency) || 0,
            passengerTonnageDaily: parseFloat(passengerTonnage) || 0,
            freightTonnageDaily: parseFloat(freightTonnage) || 0,
            locomotiveTonnageDaily: parseFloat(locomotiveTonnage) || 0,
          },
          infrastructure: {
            gauge,
            railType,
            sleeperType,
            ballastThickness: parseFloat(ballastThickness) || 0,
            subgrade,
          },
          geometry: {
            sdAlignment: parseFloat(sdAlignment) || 0,
            sdLevel: parseFloat(sdLevel) || 0,
            sdGauge: parseFloat(sdGauge) || 0,
            sdTwist: parseFloat(sdTwist) || 0,
          },
        },
        trackClassId: result.trackClass.classId,
        trackClassLabel: result.trackClass.classLabel,
        mgt: result.mgt.mgt,
        annualTonnage: result.mgt.annualTonnage,
        tqi: result.tqi.tqi,
        tqiCategory: result.tqi.category,
        effectiveMaxSpeed: result.speedValidation.effectiveMax,
        designSpeed: result.speedValidation.designSpeed,
        overallStatus: result.overallStatus,
        statusLabel: result.statusLabel,
        issueCount: result.issues.length,
        fullResult: JSON.stringify(result),
      });
      setIsSaved(true);
      toast.success("Hasil perhitungan berhasil disimpan");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-20 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Calculator className="size-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Kalkulator Kelas Jalan Rel
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Berdasarkan PM 60 Tahun 2012 & Standar TQI PT KAI
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="cursor-pointer gap-1.5"
            onClick={() => navigate("/track-history")}
          >
            <History className="size-4" />
            Riwayat & Grafik
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="cursor-pointer gap-1.5"
            onClick={() => setShowReference(!showReference)}
          >
            <FileText className="size-4" />
            {showReference ? "Tutup Referensi" : "Lihat Referensi PM 60/2012"}
          </Button>
        </div>
      </div>

      {/* Reference table toggle */}
      {showReference && <ReferenceTable gauge={gauge} />}

      {/* Progress steps */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1.5">
        {STEPS.map((s, i) => {
          const isActive = s.key === step;
          const isDone = i < currentStepIndex;
          return (
            <button
              key={s.key}
              onClick={() => {
                if (isDone || isActive) setStep(s.key);
                if (s.key === "result" && !result) return;
              }}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors sm:text-sm",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isDone
                    ? "bg-card text-foreground"
                    : "text-muted-foreground"
              )}
            >
              <s.icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Segment info (always visible in input steps) */}
      {step !== "result" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Identitas Segmen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="segmentName">Nama Lintas</Label>
                <Input
                  id="segmentName"
                  placeholder="Contoh: Cirebon - Semarang"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staStart">STA Awal</Label>
                <Input
                  id="staStart"
                  placeholder="Contoh: KM 0+000"
                  value={staStart}
                  onChange={(e) => setStaStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staEnd">STA Akhir</Label>
                <Input
                  id="staEnd"
                  placeholder="Contoh: KM 5+200"
                  value={staEnd}
                  onChange={(e) => setStaEnd(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step content */}
      {step === "operation" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Train className="size-5 text-primary" />
              Data Operasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="axleLoad">Beban Gandar (ton)</Label>
                <Input
                  id="axleLoad"
                  type="number"
                  placeholder="Contoh: 18"
                  value={axleLoad}
                  onChange={(e) => setAxleLoad(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maks 18 ton (1067mm) / 22.5 ton (1435mm)
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="designSpeed">Kecepatan Rencana (km/jam)</Label>
                <Input
                  id="designSpeed"
                  type="number"
                  placeholder="Contoh: 100"
                  value={designSpeed}
                  onChange={(e) => setDesignSpeed(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trainFrequency">Frekuensi KA (per hari)</Label>
                <Input
                  id="trainFrequency"
                  type="number"
                  placeholder="Contoh: 24"
                  value={trainFrequency}
                  onChange={(e) => setTrainFrequency(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Info className="size-4 text-primary" />
                <p className="text-sm font-medium">
                  Tonase Harian untuk Perhitungan MGT
                </p>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Rumus: TE = Tp + (Kb x Tb) + (K1 x T1) | T tahunan = 360 x TE
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="passengerTonnage">
                    Tp - Penumpang & Kereta (ton/hari)
                  </Label>
                  <Input
                    id="passengerTonnage"
                    type="number"
                    placeholder="Contoh: 15000"
                    value={passengerTonnage}
                    onChange={(e) => setPassengerTonnage(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="freightTonnage">
                    Tb - Barang & Gerbong (ton/hari)
                  </Label>
                  <Input
                    id="freightTonnage"
                    type="number"
                    placeholder="Contoh: 8000"
                    value={freightTonnage}
                    onChange={(e) => setFreightTonnage(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="locomotiveTonnage">
                    T1 - Lokomotif (ton/hari)
                  </Label>
                  <Input
                    id="locomotiveTonnage"
                    type="number"
                    placeholder="Contoh: 2400"
                    value={locomotiveTonnage}
                    onChange={(e) => setLocomotiveTonnage(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                className="cursor-pointer gap-1.5"
                onClick={() => setStep("infrastructure")}
              >
                Lanjut
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "infrastructure" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ruler className="size-5 text-primary" />
              Data Infrastruktur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Lebar Sepur</Label>
                <Select
                  value={gauge}
                  onValueChange={(v) => setGauge(v as GaugeType)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GAUGE_TYPES.map((g) => (
                      <SelectItem key={g} value={g} className="cursor-pointer">
                        {g} mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Jenis Rel</Label>
                <Select
                  value={railType}
                  onValueChange={(v) => setRailType(v as RailType)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RAIL_TYPES.map((r) => (
                      <SelectItem key={r} value={r} className="cursor-pointer">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sesuai PM 60/2012: R42, R50, R54, R60
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Jenis Bantalan</Label>
                <Select
                  value={sleeperType}
                  onValueChange={(v) => setSleeperType(v as SleeperType)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLEEPER_TYPES.map((s) => (
                      <SelectItem key={s} value={s} className="cursor-pointer">
                        {SLEEPER_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ballastThickness">Tebal Balas Atas (cm)</Label>
                <Input
                  id="ballastThickness"
                  type="number"
                  placeholder="Contoh: 30"
                  value={ballastThickness}
                  onChange={(e) => setBallastThickness(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kondisi Subgrade</Label>
                <Select
                  value={subgrade}
                  onValueChange={(v) => setSubgrade(v as SubgradeCondition)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBGRADE_CONDITIONS.map((s) => (
                      <SelectItem key={s} value={s} className="cursor-pointer">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setStep("operation")}
              >
                Kembali
              </Button>
              <Button
                className="cursor-pointer gap-1.5"
                onClick={() => setStep("geometry")}
              >
                Lanjut
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "geometry" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-5 text-primary" />
              Data Geometri (Simpangan Baku / SD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Info className="size-4 text-primary" />
                <p className="text-sm font-medium">
                  Metode TQI PT KAI
                </p>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                TQI = SD(alignment) + SD(level) + SD(gauge) + SD(twist) |
                Segmen pengukuran 200 meter
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sdAlignment">SD Alignment (mm)</Label>
                <Input
                  id="sdAlignment"
                  type="number"
                  step="0.01"
                  placeholder="Contoh: 3.5"
                  value={sdAlignment}
                  onChange={(e) => setSdAlignment(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sdLevel">SD Level / Angkatan (mm)</Label>
                <Input
                  id="sdLevel"
                  type="number"
                  step="0.01"
                  placeholder="Contoh: 4.2"
                  value={sdLevel}
                  onChange={(e) => setSdLevel(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sdGauge">SD Gauge / Lebar Spur (mm)</Label>
                <Input
                  id="sdGauge"
                  type="number"
                  step="0.01"
                  placeholder="Contoh: 2.1"
                  value={sdGauge}
                  onChange={(e) => setSdGauge(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sdTwist">SD Twist (mm)</Label>
                <Input
                  id="sdTwist"
                  type="number"
                  step="0.01"
                  placeholder="Contoh: 3.0"
                  value={sdTwist}
                  onChange={(e) => setSdTwist(e.target.value)}
                />
              </div>
            </div>

            {/* TQI reference */}
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm font-medium">Referensi Kategori TQI PT KAI</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TQI_THRESHOLDS.map((t) => (
                  <div
                    key={t.category}
                    className={cn(
                      "rounded-lg p-2.5 text-center text-xs",
                      t.color === "emerald" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                      t.color === "blue" && "bg-blue-500/10 text-blue-700 dark:text-blue-400",
                      t.color === "amber" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                      t.color === "red" && "bg-red-500/10 text-red-700 dark:text-red-400"
                    )}
                  >
                    <p className="font-semibold">{t.label}</p>
                    <p className="mt-0.5">
                      TQI {t.maxTqi === Infinity ? "> 50" : `< ${t.maxTqi}`}
                    </p>
                    <p className="mt-0.5 text-[10px] opacity-80">{t.speedRange}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setStep("infrastructure")}
              >
                Kembali
              </Button>
              <Button className="cursor-pointer gap-1.5" onClick={handleCalculate}>
                <Calculator className="size-4" />
                Hitung Kelas Jalan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "result" && result && (
        <ResultPanel
          result={result}
          segmentName={segmentName || "Segmen Tanpa Nama"}
          staStart={staStart || "-"}
          staEnd={staEnd || "-"}
          gauge={gauge}
          onReset={handleReset}
          onRecalculate={() => setStep("operation")}
          onSave={handleSave}
          isSaving={isSaving}
          isSaved={isSaved}
        />
      )}
    </div>
  );
}
