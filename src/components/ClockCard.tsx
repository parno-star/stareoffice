import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Clock, LogIn, LogOut, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { getLocalDateString, formatClock } from "@/lib/utils.ts";

export default function ClockCard() {
  const today = getLocalDateString();
  const record = useQuery(api.attendance.getTodayRecord, { date: today });
  const clockIn = useMutation(api.attendance.clockIn);
  const clockOut = useMutation(api.attendance.clockOut);

  const [dialog, setDialog] = useState<"in" | "out" | null>(null);
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    const iso = new Date().toISOString();
    try {
      if (dialog === "in") {
        await clockIn({
          nowIso: iso,
          note: note.trim() || undefined,
          location: location.trim() || undefined,
        });
        toast.success("Clock-in berhasil!");
      } else if (dialog === "out") {
        await clockOut({
          nowIso: iso,
          note: note.trim() || undefined,
        });
        toast.success("Clock-out berhasil!");
      }
      setDialog(null);
      setNote("");
      setLocation("");
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { message: string };
        toast.error(message);
      } else {
        toast.error("Terjadi kesalahan");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (record === undefined) {
    return <Skeleton className="h-48 w-full" />;
  }

  const clockedIn = !!record?.clockInAt;
  const clockedOut = !!record?.clockOutAt;

  return (
    <>
      <div className="rounded-2xl bg-[#eef5fc] dark:bg-slate-800/80 border border-blue-100/80 dark:border-slate-700/60 p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="space-y-2">
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            {dateStr}
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="size-6 text-[#004b87] dark:text-blue-400 shrink-0" />
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
              {timeStr.replace(":", ".")}
            </span>
            {record?.isLate && (
              <Badge variant="destructive" className="ml-auto gap-1 text-xs">
                <AlertCircle className="size-3" />
                Terlambat
              </Badge>
            )}
          </div>
        </div>

        {clockedIn && (
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Clock-in</div>
              <div className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5">
                {formatClock(record.clockInAt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Clock-out</div>
              <div className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5">
                {formatClock(record.clockOutAt)}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {!clockedIn && (
            <Button
              size="lg"
              className="w-full h-12 rounded-xl bg-[#004b87] hover:bg-[#003866] text-white font-semibold text-sm sm:text-base gap-2 shadow-xs cursor-pointer transition-colors"
              onClick={() => setDialog("in")}
            >
              <LogIn className="size-4" />
              <span>Clock-in</span>
            </Button>
          )}
          {clockedIn && !clockedOut && (
            <Button
              size="lg"
              className="w-full h-12 rounded-xl bg-[#004b87] hover:bg-[#003866] text-white font-semibold text-sm sm:text-base gap-2 shadow-xs cursor-pointer transition-colors"
              onClick={() => setDialog("out")}
            >
              <LogOut className="size-4" />
              <span>Clock-out</span>
            </Button>
          )}
          {clockedOut && (
            <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Selamat, Anda telah menyelesaikan pekerjaan hari ini
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "in" ? "Clock-in" : "Clock-out"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "in"
                ? "Catat waktu mulai kerja Anda"
                : "Catat waktu selesai kerja Anda"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dialog === "in" && (
              <div className="space-y-2">
                <Label htmlFor="loc" className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  Lokasi (opsional)
                </Label>
                <Input
                  id="loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Kantor pusat / Remote / Client site"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="note">Catatan (opsional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  dialog === "in"
                    ? "Mulai hari produktif"
                    : "Menyelesaikan laporan mingguan"
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialog(null)}
              disabled={submitting}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="cursor-pointer"
            >
              {submitting ? "Memproses..." : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
