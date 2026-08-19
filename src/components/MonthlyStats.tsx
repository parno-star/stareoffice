import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { CalendarCheck, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { getMonthRange, formatMinutes } from "@/lib/utils.ts";

export default function MonthlyStats() {
  const range = getMonthRange();
  const stats = useQuery(api.attendance.getMyMonthSummary, {
    startDate: range.start,
    endDate: range.end,
  });

  if (stats === undefined) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const presentDays = stats?.presentDays ?? 0;
  const lateDays = stats?.lateDays ?? 0;
  const totalMinutes = stats?.totalMinutes ?? 0;
  const avgMinutes = stats?.avgMinutes ?? 0;

  const items = [
    {
      icon: CalendarCheck,
      label: "Hari Hadir",
      value: presentDays.toString(),
      iconBg: "bg-[#e6f0fa] dark:bg-blue-950/60",
      iconColor: "text-[#004b87] dark:text-blue-400",
    },
    {
      icon: AlertTriangle,
      label: "Terlambat",
      value: lateDays.toString(),
      iconBg: "bg-[#fff4e5] dark:bg-amber-950/60",
      iconColor: "text-[#d97706] dark:text-amber-400",
    },
    {
      icon: Clock,
      label: "Total Jam",
      value: totalMinutes > 0 ? formatMinutes(totalMinutes) : "-",
      iconBg: "bg-[#e6f7f0] dark:bg-emerald-950/60",
      iconColor: "text-[#059669] dark:text-emerald-400",
    },
    {
      icon: TrendingUp,
      label: "Rata-rata",
      value: avgMinutes > 0 ? formatMinutes(avgMinutes) : "-",
      iconBg: "bg-[#f3e8ff] dark:bg-purple-950/60",
      iconColor: "text-[#7c3aed] dark:text-purple-400",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-foreground">
          Ringkasan {range.label}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-card border border-border/70 p-4 space-y-3 shadow-2xs hover:border-primary/30 transition-colors"
          >
            <div className={`size-10 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
              <item.icon className={`size-5 ${item.iconColor}`} />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                {item.label}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
