import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  List,
  Grid,
  MapPin,
  Clock,
  User,
  Users,
  Building,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import { getCategoryConfig, toIsoDate } from "@/lib/calendar-utils.ts";
import MonthGrid from "@/components/MonthGrid.tsx";
import CreateEventDialog from "@/components/CreateEventDialog.tsx";
import RsvpButtons from "@/components/RsvpButtons.tsx";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const INITIAL_MOCK_EVENTS = [
  {
    _id: "ev_1",
    title: "Rapat Koordinasi Tim & Project Sync",
    category: "meeting",
    scope: "company",
    startDate: toIsoDate(new Date()),
    endDate: toIsoDate(new Date()),
    allDay: false,
    startTime: "09:00",
    endTime: "10:30",
    location: "Ruang Rapat Utama Lt. 2 & Google Meet",
    description: "Evaluasi progress mingguan pencapaian KPI dan pembahasan strategi sprint selanjutnya.",
    authorName: "Budi Santoso",
    goingCount: 8,
    maybeCount: 2,
    notGoingCount: 0,
    myRsvp: "going" as const,
  },
  {
    _id: "ev_2",
    title: "Hari Kemerdekaan Republik Indonesia",
    category: "holiday",
    scope: "company",
    startDate: "2026-08-17",
    endDate: "2026-08-17",
    allDay: true,
    location: "Nasional / Perusahaan Libur",
    description: "Hari Libur Nasional Peringatan Kemerdekaan RI ke-81.",
    authorName: "HR Department",
    goingCount: 45,
    maybeCount: 0,
    notGoingCount: 0,
    myRsvp: "going" as const,
  },
  {
    _id: "ev_3",
    title: "Pelatihan Keamanan Informasi & Cyber Security",
    category: "training",
    scope: "company",
    startDate: "2026-08-20",
    endDate: "2026-08-20",
    allDay: false,
    startTime: "13:00",
    endTime: "16:00",
    location: "Aula Utama Lt. 3",
    description: "Workshop wajib tentang kesadaran keamanan data dan kebijakan keamanan TI perusahaan.",
    authorName: "Tim IT Security",
    goingCount: 15,
    maybeCount: 3,
    notGoingCount: 1,
    myRsvp: "going" as const,
  },
  {
    _id: "ev_4",
    title: "Townhall & Gathering Perusahaan Q3",
    category: "event",
    scope: "company",
    startDate: "2026-08-25",
    endDate: "2026-08-25",
    allDay: false,
    startTime: "10:00",
    endTime: "12:00",
    location: "Auditorium Starfa e-Office",
    description: "Sesi apresiasi karyawan, pengumuman update strategi perusahaan, dan ramah tamah.",
    authorName: "Direksi",
    goingCount: 32,
    maybeCount: 5,
    notGoingCount: 2,
    myRsvp: null,
  },
  {
    _id: "ev_5",
    title: "Tenggat Penutupan Laporan Keuangan Bulanan",
    category: "deadline",
    scope: "company",
    startDate: "2026-08-31",
    endDate: "2026-08-31",
    allDay: true,
    location: "Departemen Keuangan",
    description: "Batas akhir penyerahan klaim biaya dan laporan keuangan bulanan.",
    authorName: "Finance Team",
    goingCount: 6,
    maybeCount: 1,
    notGoingCount: 0,
    myRsvp: "going" as const,
  },
];

export default function CalendarPage() {
  const navigate = useNavigate();

  // Navigation State
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [selectedDate, setSelectedDate] = useState<string>(() => toIsoDate(new Date()));

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedScope, setSelectedScope] = useState<string>("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Convex query integration
  const convexEvents = useQuery(api.events.listAll, {});

  // Combine or fallback to mock
  const events = useMemo(() => {
    if (convexEvents && convexEvents.length > 0) {
      return convexEvents.map((ev) => ({
        _id: ev._id as string,
        title: ev.title,
        category: ev.category,
        scope: ev.scope ?? "company",
        startDate: ev.startDate,
        endDate: ev.endDate,
        allDay: ev.allDay ?? false,
        startTime: ev.startTime,
        endTime: ev.endTime,
        location: ev.location,
        description: ev.description,
        authorName: ev.authorName ?? "Admin",
        goingCount: ev.goingCount ?? 0,
        maybeCount: ev.maybeCount ?? 0,
        notGoingCount: ev.notGoingCount ?? 0,
        myRsvp: ev.myRsvp ?? null,
      }));
    }
    return INITIAL_MOCK_EVENTS;
  }, [convexEvents]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Search
      if (
        searchQuery &&
        !ev.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(ev.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // Category
      if (selectedCategory !== "all" && ev.category !== selectedCategory) {
        return false;
      }
      // Scope
      if (selectedScope !== "all" && ev.scope !== selectedScope) {
        return false;
      }
      return true;
    });
  }, [events, searchQuery, selectedCategory, selectedScope]);

  // Events on selected date
  const eventsOnSelectedDate = useMemo(() => {
    return filteredEvents.filter((ev) => {
      return selectedDate >= ev.startDate && selectedDate <= ev.endDate;
    });
  }, [filteredEvents, selectedDate]);

  // Handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(toIsoDate(today));
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CalendarIcon className="size-7 text-primary" />
            Kalender
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Jadwal kegiatan, rapat, deadline, dan event perusahaan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Create Event Dialog Trigger */}
          <CreateEventDialog
            defaultDate={selectedDate}
            trigger={
              <Button className="h-10 gap-2 font-semibold shadow-xs cursor-pointer">
                <Plus className="size-4" />
                <span>Buat Event</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* 2. Month Navigator Bar & View Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-3 rounded-2xl border shadow-2xs">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="size-9 rounded-xl cursor-pointer"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="size-9 rounded-xl cursor-pointer"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-9 px-3 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Hari Ini
          </Button>

          <h2 className="text-lg font-bold text-foreground pl-2">
            {MONTH_NAMES[month]} {year}
          </h2>
        </div>

        {/* View Switcher: Bulanan / Daftar */}
        <div className="flex items-center gap-1 p-1 bg-muted/70 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              viewMode === "month"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid className="size-3.5" />
            <span>Bulanan</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              viewMode === "list"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-3.5" />
            <span>Daftar</span>
          </button>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama event atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-full sm:w-40">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="meeting">Rapat</SelectItem>
              <SelectItem value="holiday">Hari Libur</SelectItem>
              <SelectItem value="training">Pelatihan</SelectItem>
              <SelectItem value="event">Acara</SelectItem>
              <SelectItem value="deadline">Tenggat</SelectItem>
            </SelectContent>
          </Select>

          {/* Scope Filter */}
          <Select value={selectedScope} onValueChange={setSelectedScope}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-full sm:w-40">
              <SelectValue placeholder="Semua Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Scope</SelectItem>
              <SelectItem value="company">Perusahaan</SelectItem>
              <SelectItem value="team">Tim / Dept</SelectItem>
              <SelectItem value="personal">Pribadi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Main View Content */}
      {viewMode === "month" ? (
        <div className="space-y-6">
          {/* Month Calendar Grid */}
          <MonthGrid
            year={year}
            month={month}
            events={filteredEvents as any}
            selectedDate={selectedDate}
            onSelectDate={(iso) => setSelectedDate(iso)}
          />

          {/* Events List for Selected Date */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                Acara Tanggal {selectedDate}
              </h3>
              <span className="text-xs text-muted-foreground font-medium">
                {eventsOnSelectedDate.length} acara ditemukan
              </span>
            </div>

            {eventsOnSelectedDate.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-2xl bg-card/40">
                <p className="text-sm text-muted-foreground font-medium">
                  Tidak ada acara pada tanggal ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventsOnSelectedDate.map((ev) => {
                  const cfg = getCategoryConfig(ev.category);
                  return (
                    <Card
                      key={ev._id}
                      onClick={() => navigate(`/calendar/${ev._id}`)}
                      className="group p-4 rounded-2xl border hover:shadow-md transition-all cursor-pointer space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            cfg.bg,
                            cfg.text
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>

                        <span className="text-[11px] font-medium text-muted-foreground">
                          {ev.allDay ? "Seharian" : `${ev.startTime ?? ""} - ${ev.endTime ?? ""}`}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {ev.title}
                        </h4>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      {ev.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0 text-primary" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-14 border border-dashed rounded-2xl bg-card/40 space-y-2">
              <CalendarIcon className="size-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                Tidak ada event yang sesuai dengan filter.
              </p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const cfg = getCategoryConfig(ev.category);

              return (
                <div
                  key={ev._id}
                  onClick={() => navigate(`/calendar/${ev._id}`)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-card hover:bg-muted/40 transition-all cursor-pointer gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "size-11 rounded-xl flex flex-col items-center justify-center shrink-0 border font-bold text-xs",
                        cfg.bg,
                        cfg.text
                      )}
                    >
                      <span>{ev.startDate.slice(8, 10)}</span>
                      <span className="text-[10px] uppercase font-normal">{ev.startDate.slice(5, 7)}</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            cfg.bg,
                            cfg.text
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>

                        <span className="text-xs text-muted-foreground font-medium">
                          {ev.allDay ? "Seharian" : `${ev.startTime || ""} - ${ev.endTime || ""}`}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {ev.title}
                      </h3>

                      {ev.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <RsvpButtons eventId={ev._id as any} current={ev.myRsvp} size="sm" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
