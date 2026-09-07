import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { isAdminRole } from "@/convex/roles.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { getCategoryConfig } from "./_lib/calendar-utils.ts";
import RsvpButtons from "./_components/RsvpButtons.tsx";
import AttendeesList from "./_components/AttendeesList.tsx";
import CreateEventDialog from "./_components/CreateEventDialog.tsx";

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "EEEE, d MMMM yyyy", { locale: idLocale });
  } catch {
    return iso;
  }
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const event = useQuery(
    api.events.getById,
    eventId ? { id: eventId as Id<"events"> } : "skip",
  );
  const remove = useMutation(api.events.remove);

  if (event === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (event === null) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
        <Button variant="ghost" onClick={() => navigate("/calendar")}>
          <ArrowLeft className="size-4" />
          Kembali ke kalender
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Acara tidak ditemukan atau telah dihapus.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cfg = getCategoryConfig(event.category);
  const canManage =
    !!currentUser &&
    (isAdminRole(currentUser.role) || event.authorId === currentUser._id);

  const handleDelete = async () => {
    try {
      await remove({ id: event._id });
      toast.success("Acara dihapus");
      navigate("/calendar");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus");
      } else {
        toast.error("Gagal menghapus");
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" asChild>
          <Link to="/calendar">
            <ArrowLeft className="size-4" />
            Kembali ke kalender
          </Link>
        </Button>
        {canManage ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setEditOpen(true)}
              className="gap-2"
            >
              <Pencil className="size-4" />
              Ubah
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="size-4" />
                  Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus acara?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {`Acara "${event.title}" akan dihapus permanen.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            className={`border-l-4 ${cfg.border.replace("border-", "border-l-")}`}
          >
            <CardContent className="space-y-4">
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
                >
                  <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                  {event.title}
                </h1>
              </div>

              <div className="grid gap-3 text-sm text-foreground/90 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <Calendar className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Tanggal
                    </p>
                    <p className="capitalize">
                      {formatDate(event.startDate)}
                      {event.endDate !== event.startDate
                        ? ` – ${formatDate(event.endDate)}`
                        : ""}
                    </p>
                  </div>
                </div>

                {!event.allDay && event.startTime ? (
                  <div className="flex items-start gap-2">
                    <Clock className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Waktu
                      </p>
                      <p>
                        {event.startTime}
                        {event.endTime ? ` – ${event.endTime}` : ""}
                      </p>
                    </div>
                  </div>
                ) : event.allDay ? (
                  <div className="flex items-start gap-2">
                    <Clock className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Waktu
                      </p>
                      <p>Sepanjang hari</p>
                    </div>
                  </div>
                ) : null}

                {event.location ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Lokasi
                      </p>
                      <p>{event.location}</p>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-start gap-2">
                  <User className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Dibuat oleh
                    </p>
                    <p>{event.authorName}</p>
                  </div>
                </div>
              </div>

              {event.description ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Deskripsi
                  </p>
                  <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm leading-relaxed text-foreground/90">
                    {event.description}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <h2 className="font-semibold">Konfirmasi Kehadiran Anda</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Bantu panitia mengetahui siapa saja yang akan hadir.
              </p>
              <RsvpButtons
                eventId={event._id}
                current={event.myRsvp}
                size="default"
              />
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-sm">
                <div className="rounded-lg border bg-emerald-500/10 p-2">
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {event.goingCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Hadir</p>
                </div>
                <div className="rounded-lg border bg-amber-500/10 p-2">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {event.maybeCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Mungkin</p>
                </div>
                <div className="rounded-lg border bg-rose-500/10 p-2">
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    {event.notGoingCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Tidak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <AttendeesList eventId={event._id} />
        </div>
      </div>

      {canManage ? (
        <CreateEventDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          editValues={{
            id: event._id,
            title: event.title,
            category: event.category,
            description: event.description ?? undefined,
            startDate: event.startDate,
            endDate: event.endDate,
            allDay: event.allDay,
            startTime: event.startTime ?? undefined,
            endTime: event.endTime ?? undefined,
            location: event.location ?? undefined,
          }}
        />
      ) : null}
    </div>
  );
}
