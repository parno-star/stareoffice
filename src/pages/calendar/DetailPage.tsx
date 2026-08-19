import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Users,
  Trash2,
  Share2,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { getCategoryConfig } from "@/lib/calendar-utils.ts";
import RsvpButtons from "@/components/RsvpButtons.tsx";
import AttendeesList from "@/components/AttendeesList.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // Try fetching from Convex if valid Id
  const convexEvent = useQuery(
    api.events.getById,
    eventId && eventId.length > 5 ? { id: eventId as Id<"events"> } : "skip"
  );

  const removeMutation = useMutation(api.events.remove);

  // Fallback mock if not found in DB
  const mockEvent = {
    _id: eventId ?? "ev_1",
    title: "Rapat Koordinasi Tim & Project Sync",
    category: "meeting",
    scope: "company",
    startDate: "2026-08-10",
    endDate: "2026-08-10",
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
  };

  const event = convexEvent ?? mockEvent;
  const cfg = getCategoryConfig(event.category);

  const handleDelete = async () => {
    try {
      if (eventId && eventId.length > 5) {
        await removeMutation({ id: eventId as Id<"events"> });
      }
      toast.success("Event berhasil dihapus");
      navigate("/calendar");
    } catch {
      toast.error("Gagal menghapus event");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <button
        type="button"
        onClick={() => navigate("/calendar")}
        className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="size-3.5 mr-1" />
        Kembali ke Kalender
      </button>

      {/* Main Header Card */}
      <Card className="rounded-2xl border overflow-hidden">
        <div className={cn("px-6 py-4 border-b flex items-center justify-between", cfg.bg)}>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", cfg.bg, cfg.text)}>
            <span className={cn("size-2 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Tautan event berhasil disalin");
              }}
              className="h-8 gap-1.5 text-xs bg-background cursor-pointer"
            >
              <Share2 className="size-3.5" />
              <span>Bagikan</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <Trash2 className="size-3.5 mr-1" />
              <span>Hapus</span>
            </Button>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {event.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Dibuat oleh <span className="font-semibold text-foreground">{event.authorName}</span>
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CalendarIcon className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">Tanggal Event</p>
                <p className="text-xs font-bold text-foreground">{event.startDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">Waktu</p>
                <p className="text-xs font-bold text-foreground">
                  {event.allDay ? "Seharian" : `${event.startTime || ""} - ${event.endTime || ""}`}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">Lokasi / Tempat</p>
                  <p className="text-xs font-bold text-foreground">{event.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Deskripsi Event
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* RSVP Section */}
          <div className="border-t pt-4 space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Konfirmasi Kehadiran Anda
            </h3>
            <RsvpButtons eventId={event._id as any} current={event.myRsvp as any} size="default" />
          </div>
        </CardContent>
      </Card>

      {/* Attendees List */}
      {eventId && eventId.length > 5 && (
        <AttendeesList eventId={eventId as Id<"events">} />
      )}
    </div>
  );
}
