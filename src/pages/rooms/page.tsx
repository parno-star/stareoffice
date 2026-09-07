import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  DoorClosed,
  MapPin,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import RoomCard from "./_components/RoomCard.tsx";
import RoomFormDialog from "./_components/RoomFormDialog.tsx";
import BookingDialog from "./_components/BookingDialog.tsx";
import BookingTimeline from "./_components/BookingTimeline.tsx";
import BookingCallButton from "./_components/BookingCallButton.tsx";
import {
  formatDateLong,
  formatDateShort,
  formatTime,
  getInitials,
  toIsoDate,
} from "./_lib/rooms-utils.ts";

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
}) {
  const displayValue =
    typeof value === "number" && Number.isNaN(value) ? "-" : value;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums">{displayValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + days);
  return toIsoDate(dt);
}

function MyBookingsList({
  currentUserId,
  currentUserName,
}: {
  currentUserId: Id<"users"> | null;
  currentUserName: string | null;
}) {
  const myBookings = useQuery(api.rooms.listMyBookings, { upcomingOnly: true });
  const cancelBooking = useMutation(api.rooms.cancelBooking);

  const handleCancel = async (bookingId: Id<"roomBookings">) => {
    try {
      await cancelBooking({ bookingId });
      toast.success("Pemesanan dibatalkan");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal membatalkan pemesanan");
      } else {
        toast.error("Gagal membatalkan pemesanan");
      }
    }
  };

  if (myBookings === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (myBookings.length === 0) {
    return (
      <Empty className="bg-muted/30">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDays />
          </EmptyMedia>
          <EmptyTitle>Belum ada pemesanan aktif</EmptyTitle>
          <EmptyDescription>
            Buat pemesanan ruangan untuk rapat atau diskusi Anda.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <BookingDialog />
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <div className="space-y-2">
      {myBookings.map((b) => (
        <div
          key={b._id}
          className="flex items-start gap-3 rounded-lg border p-3"
        >
          <Avatar className="size-9">
            {b.userAvatar ? <AvatarImage src={b.userAvatar} /> : null}
            <AvatarFallback className="bg-primary/10 text-xs">
              {getInitials(b.userName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{b.title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DoorOpen className="size-3" />
                {b.roomName ?? "-"}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                {formatDateShort(b.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatTime(b.startTime)} - {formatTime(b.endTime)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <BookingCallButton
              bookingId={b._id}
              bookingTitle={b.title}
              userName={currentUserName}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon-sm" variant="ghost" className="shrink-0">
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Batalkan pemesanan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pemesanan "{b.title}" akan dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Tidak</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleCancel(b._id)}>
                    Batalkan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RoomsPage() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const rooms = useQuery(api.rooms.listRooms, { includeInactive: true });
  const stats = useQuery(api.rooms.getStats, {});

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(new Date()));
  const [search, setSearch] = useState("");

  const isAdmin = currentUser?.role === "admin";
  const currentUserId = currentUser?._id ?? null;
  const currentUserName = currentUser?.name ?? null;

  const bookings = useQuery(
    api.rooms.listBookingsOnDate,
    selectedRoomId
      ? { roomId: selectedRoomId as Id<"rooms">, date: selectedDate }
      : { date: selectedDate },
  );

  const filteredRooms = (rooms ?? []).filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      (r.location ?? "").toLowerCase().includes(q)
    );
  });

  const selectedRoom = (rooms ?? []).find((r) => r._id === selectedRoomId);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-cyan-500/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-background shadow-sm">
              <DoorOpen className="size-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Pemesanan Ruangan
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Lihat ketersediaan ruang rapat dan pesan sesuai kebutuhan Anda.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin ? <RoomFormDialog /> : null}
            <BookingDialog />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total Ruangan"
          value={stats?.totalRooms ?? "-"}
          icon={DoorOpen}
          accent="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
        />
        <StatTile
          label="Aktif"
          value={stats?.activeRooms ?? "-"}
          icon={DoorClosed}
          accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
        <StatTile
          label="Pemesanan Hari Ini"
          value={stats?.todayBookings ?? "-"}
          icon={CalendarDays}
          accent="bg-sky-500/15 text-sky-600 dark:text-sky-400"
        />
        <StatTile
          label="Pemesanan Saya"
          value={stats?.myUpcoming ?? "-"}
          icon={Users}
          accent="bg-amber-500/15 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* My bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pemesanan Aktif Saya</CardTitle>
        </CardHeader>
        <CardContent>
          <MyBookingsList
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">Semua Ruangan</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal Harian</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Rooms list */}
        <div className="space-y-4 lg:col-span-3">
          <Input
            placeholder="Cari ruangan atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {rooms === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <DoorOpen />
                </EmptyMedia>
                <EmptyTitle>
                  {search
                    ? "Tidak ada ruangan cocok"
                    : "Belum ada ruangan"}
                </EmptyTitle>
                <EmptyDescription>
                  {search
                    ? "Coba kata kunci lain atau hapus pencarian."
                    : isAdmin
                      ? "Tambahkan ruang rapat pertama untuk memulai."
                      : "Silakan hubungi admin untuk menambah ruangan."}
                </EmptyDescription>
              </EmptyHeader>
              {!search && isAdmin ? (
                <EmptyContent>
                  <RoomFormDialog />
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="space-y-3">
              {filteredRooms.map((r) => (
                <RoomCard
                  key={r._id}
                  room={r}
                  isAdmin={isAdmin}
                  onSelect={setSelectedRoomId}
                  isSelected={selectedRoomId === r._id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Schedule panel */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Jadwal Ruangan</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setSelectedDate((d) => addDays(d, -1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() =>
                      setSelectedDate(toIsoDate(new Date()))
                    }
                    title="Hari ini"
                  >
                    <CalendarDays className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setSelectedDate((d) => addDays(d, 1))}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-2.5">
                <p className="text-xs text-muted-foreground">Tanggal</p>
                <p className="text-sm font-semibold capitalize">
                  {formatDateLong(selectedDate)}
                </p>
              </div>
              {selectedRoom ? (
                <div className="flex items-start gap-3 rounded-md border p-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
                    <DoorOpen className="size-4.5 text-indigo-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {selectedRoom.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {selectedRoom.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {selectedRoom.location}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {selectedRoom.capacity}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedRoomId(null)}
                  >
                    Semua
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pilih ruangan di sebelah kiri untuk melihat jadwalnya, atau
                  lihat semua pemesanan pada tanggal ini.
                </p>
              )}
            </CardHeader>
            <CardContent>
              {bookings === undefined ? (
                <Skeleton className="h-96 w-full" />
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 py-10 text-center">
                  <CalendarDays className="size-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium">Belum ada pemesanan</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Jadwal kosong pada tanggal ini. Buat pemesanan baru untuk
                    mengisi slot.
                  </p>
                  <BookingDialog
                    initialRoomId={
                      selectedRoomId ? (selectedRoomId as Id<"rooms">) : null
                    }
                    initialDate={selectedDate}
                    trigger={
                      <Button size="sm" className="mt-1">
                        Pesan Sekarang
                      </Button>
                    }
                  />
                </div>
              ) : (
                <BookingTimeline
                  bookings={bookings}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  isAdmin={isAdmin}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
