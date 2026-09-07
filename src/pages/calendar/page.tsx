import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { isAdminRole } from "@/convex/roles.ts";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarCheck,
  Clock,
  PartyPopper,
  List as ListIcon,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import MonthGrid from "./_components/MonthGrid.tsx";
import EventCard from "./_components/EventCard.tsx";
import CreateEventDialog from "./_components/CreateEventDialog.tsx";
import {
  CATEGORY_CONFIG,
  toIsoDate,
} from "./_lib/calendar-utils.ts";

export default function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(toIsoDate(today));
  const [view, setView] = useState<"month" | "list">("month");
  const [listCategory, setListCategory] = useState<string>("all");
  const [listScope, setListScope] = useState<"upcoming" | "past">("upcoming");

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const isAdmin = isAdminRole(currentUser?.role);

  // Compute range covering the full visible grid (6 weeks = 42 days starting from Monday)
  const { rangeStart, rangeEnd } = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const offset = (first.getDay() + 6) % 7;
    const gridStart = new Date(viewYear, viewMonth, 1 - offset);
    const gridEnd = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + 41,
    );
    return {
      rangeStart: toIsoDate(gridStart),
      rangeEnd: toIsoDate(gridEnd),
    };
  }, [viewYear, viewMonth]);

  const events = useQuery(api.events.listInRange, { rangeStart, rangeEnd });
  const stats = useQuery(api.events.getStats, {});
  const listEvents = useQuery(
    api.events.listAll,
    view === "list"
      ? { scope: listScope, category: listCategory }
      : "skip",
  );

  const selectedEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(
      (ev) => selectedDate >= ev.startDate && selectedDate <= ev.endDate,
    );
  }, [events, selectedDate]);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(toIsoDate(now));
  };

  const monthLabel = format(new Date(viewYear, viewMonth, 1), "MMMM yyyy", {
    locale: idLocale,
  });

  const selectedDateLabel = (() => {
    try {
      return format(parseISO(selectedDate), "EEEE, d MMMM yyyy", {
        locale: idLocale,
      });
    } catch {
      return selectedDate;
    }
  })();

  const statCards = [
    {
      label: "Bulan ini",
      value: stats?.thisMonth ?? 0,
      icon: CalendarDays,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Minggu ini",
      value: stats?.thisWeek ?? 0,
      icon: Clock,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Saya hadiri",
      value: stats?.myRsvpGoing ?? 0,
      icon: CalendarCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Hari libur",
      value: stats?.holidaysThisMonth ?? 0,
      icon: PartyPopper,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Kalender Perusahaan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lihat rapat, hari libur, pelatihan, dan acara penting perusahaan.
          </p>
        </div>
        {isAdmin ? <CreateEventDialog defaultDate={selectedDate} /> : null}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-lg ${s.bg} ${s.color}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <div className="text-xl font-bold">
                    {stats === undefined ? (
                      <Skeleton className="h-6 w-8" />
                    ) : (
                      s.value
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as "month" | "list")}>
        <TabsList>
          <TabsTrigger value="month" className="cursor-pointer">
            <CalendarDays className="size-4" />
            Bulanan
          </TabsTrigger>
          <TabsTrigger value="list" className="cursor-pointer">
            <ListIcon className="size-4" />
            Daftar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${cfg.dot}`} />
                <span className="text-muted-foreground">{cfg.label}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendar */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={goToday}
                    className="cursor-pointer"
                  >
                    Hari ini
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={goPrev}
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={goNext}
                    className="cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              {events === undefined ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <MonthGrid
                  year={viewYear}
                  month={viewMonth}
                  events={events}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
            </div>

            {/* Selected day events */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold capitalize">{selectedDateLabel}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedEvents.length} acara
                </p>
              </div>

              {events === undefined ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : selectedEvents.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CalendarDays />
                    </EmptyMedia>
                    <EmptyTitle>Tidak ada acara</EmptyTitle>
                    <EmptyDescription>
                      {isAdmin
                        ? "Tambahkan acara baru untuk tanggal ini."
                        : "Belum ada acara pada tanggal yang dipilih."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((ev) => (
                    <EventCard
                      key={ev._id}
                      event={ev}
                      canDelete={
                        isAdmin ||
                        (!!currentUser && ev.authorId === currentUser._id)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daftar Acara</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Tabs
                  value={listScope}
                  onValueChange={(v) => setListScope(v as "upcoming" | "past")}
                >
                  <TabsList>
                    <TabsTrigger value="upcoming" className="cursor-pointer">
                      Mendatang
                    </TabsTrigger>
                    <TabsTrigger value="past" className="cursor-pointer">
                      Selesai
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Select value={listCategory} onValueChange={setListCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua kategori</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([value, cfg]) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {listEvents === undefined ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-44 w-full" />
                  ))}
                </div>
              ) : listEvents.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CalendarDays />
                    </EmptyMedia>
                    <EmptyTitle>Tidak ada acara</EmptyTitle>
                    <EmptyDescription>
                      {listScope === "upcoming"
                        ? "Belum ada acara yang akan datang."
                        : "Belum ada acara yang telah selesai."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {listEvents.map((ev) => (
                    <EventCard
                      key={ev._id}
                      event={ev}
                      canDelete={
                        isAdmin ||
                        (!!currentUser && ev.authorId === currentUser._id)
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
