import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { isAdminRole } from "@/convex/roles.ts";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
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
import { Input } from "@/components/ui/input.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  PartyPopper,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { CATEGORY_CONFIG } from "@/pages/calendar/_lib/calendar-utils.ts";
import { EVENT_TYPES } from "./_lib/events-utils.ts";
import EventListCard from "./_components/EventListCard.tsx";
import FeaturedEventCard from "./_components/FeaturedEventCard.tsx";
import EventFormDialog from "./_components/EventFormDialog.tsx";
import type { EnrichedEvent } from "./_components/types.ts";

type Scope = "upcoming" | "past";
type RsvpFilter = "any" | "going" | "maybe" | "not_going";

export default function EventsPage() {
  const [scope, setScope] = useState<Scope>("upcoming");
  const [category, setCategory] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>("any");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EnrichedEvent | null>(null);

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const stats = useQuery(api.events.getCompanyEventStats, {});
  const events = useQuery(api.events.listCompanyEvents, {
    scope,
    category,
    eventType,
    myRsvp: rsvpFilter,
  });

  const isAdmin = isAdminRole(currentUser?.role);

  const filteredEvents = useMemo(() => {
    if (!events) return undefined;
    const needle = search.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((e) => {
      const haystack = [
        e.title,
        e.description ?? "",
        e.location ?? "",
        e.authorName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [events, search]);

  const featured = useMemo<EnrichedEvent | null>(() => {
    if (!events || scope !== "upcoming") return null;
    const featuredCandidate = events.find((e) => e.isFeatured);
    return featuredCandidate ?? events[0] ?? null;
  }, [events, scope]);

  const restEvents = useMemo<Array<EnrichedEvent>>(() => {
    if (!filteredEvents) return [];
    if (!featured) return filteredEvents;
    return filteredEvents.filter((e) => e._id !== featured._id);
  }, [filteredEvents, featured]);

  const statCards = [
    {
      label: "Akan datang",
      value: stats?.totalUpcoming ?? 0,
      icon: CalendarClock,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Unggulan",
      value: stats?.featuredCount ?? 0,
      icon: Sparkles,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Saya hadiri",
      value: stats?.myRsvpGoing ?? 0,
      icon: CalendarCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Mungkin hadir",
      value: stats?.myRsvpMaybe ?? 0,
      icon: Users,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  const emptyMessage =
    scope === "upcoming"
      ? "Belum ada acara yang akan datang sesuai filter."
      : "Belum ada acara yang sudah selesai.";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <PartyPopper className="size-6 text-primary" />
            Event Perusahaan & RSVP
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ikuti gathering, townhall, workshop, dan acara perusahaan lainnya.
            Konfirmasikan kehadiran dengan RSVP.
          </p>
        </div>
        {isAdmin ? <EventFormDialog /> : null}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${s.bg} ${s.color}`}
                >
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

      {scope === "upcoming" && events === undefined ? (
        <Skeleton className="h-72 w-full" />
      ) : null}
      {scope === "upcoming" && featured ? (
        <FeaturedEventCard event={featured} />
      ) : null}

      <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
        <div className="flex flex-wrap items-center gap-3">
          <TabsList>
            <TabsTrigger value="upcoming" className="cursor-pointer">
              <CalendarClock className="size-4" />
              Akan datang
            </TabsTrigger>
            <TabsTrigger value="past" className="cursor-pointer">
              <CalendarDays className="size-4" />
              Selesai
            </TabsTrigger>
          </TabsList>

          <div className="relative ml-auto flex-1 min-w-[220px] md:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari acara, lokasi..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kategori</SelectItem>
              {Object.entries(CATEGORY_CONFIG)
                .filter(([k]) => k !== "deadline")
                .map(([value, cfg]) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Jenis acara" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua jenis</SelectItem>
              {Object.entries(EVENT_TYPES).map(([value, cfg]) => (
                <SelectItem key={value} value={value}>
                  <span className="flex items-center gap-2">
                    <span>{cfg.emoji}</span>
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={rsvpFilter}
            onValueChange={(v) => setRsvpFilter(v as RsvpFilter)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="RSVP saya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Semua RSVP</SelectItem>
              <SelectItem value="going">Hadir</SelectItem>
              <SelectItem value="maybe">Mungkin</SelectItem>
              <SelectItem value="not_going">Tidak hadir</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="upcoming" className="mt-4">
          <EventsGrid
            events={restEvents}
            isLoading={events === undefined}
            isAdmin={isAdmin}
            emptyMessage={emptyMessage}
            onEditStart={(ev) => setEditing(ev)}
          />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <EventsGrid
            events={filteredEvents ?? []}
            isLoading={events === undefined}
            isAdmin={isAdmin}
            emptyMessage={emptyMessage}
            onEditStart={(ev) => setEditing(ev)}
          />
        </TabsContent>
      </Tabs>

      {editing ? (
        <EventFormDialog
          open={true}
          onOpenChange={(v) => {
            if (!v) setEditing(null);
          }}
          editValues={{
            id: editing._id,
            title: editing.title,
            category: editing.category,
            eventType: editing.eventType,
            description: editing.description ?? undefined,
            startDate: editing.startDate,
            endDate: editing.endDate,
            allDay: editing.allDay,
            startTime: editing.startTime ?? undefined,
            endTime: editing.endTime ?? undefined,
            location: editing.location ?? undefined,
            capacity: editing.capacity ?? undefined,
            rsvpDeadline: editing.rsvpDeadline ?? undefined,
            isFeatured: editing.isFeatured ?? false,
            bannerUrl: editing.bannerUrl,
          }}
        />
      ) : null}
    </div>
  );
}

function EventsGrid({
  events,
  isLoading,
  isAdmin,
  emptyMessage,
  onEditStart,
}: {
  events: Array<EnrichedEvent>;
  isLoading: boolean;
  isAdmin: boolean;
  emptyMessage: string;
  onEditStart: (ev: EnrichedEvent) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PartyPopper />
          </EmptyMedia>
          <EmptyTitle>Tidak ada acara</EmptyTitle>
          <EmptyDescription>{emptyMessage}</EmptyDescription>
        </EmptyHeader>
        {isAdmin ? (
          <EmptyContent>
            <EventFormDialog
              trigger={
                <Button size="sm" className="gap-2">
                  Buat acara pertama
                </Button>
              }
            />
          </EmptyContent>
        ) : null}
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((ev) => (
        <EventListCard
          key={ev._id}
          event={ev}
          canManage={isAdmin}
          onEdit={() => onEditStart(ev)}
        />
      ))}
    </div>
  );
}
