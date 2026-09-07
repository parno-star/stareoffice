import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { MessagesSquare, Search } from "lucide-react";
import CreateThreadDialog from "./_components/CreateThreadDialog.tsx";
import ThreadCard from "./_components/ThreadCard.tsx";
import { CATEGORY_CONFIG } from "./_lib/forum-utils.ts";

export default function ForumPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [debouncedSearch] = useDebounce(search, 300);

  const threads = useQuery(api.forum.listThreads, {
    search: debouncedSearch,
    category,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Forum Diskusi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tempat berdiskusi, bertanya, dan berbagi ide dengan rekan tim.
          </p>
        </div>
        <CreateThreadDialog />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari diskusi berdasarkan judul..."
          className="pl-9"
        />
      </div>

      {/* Category tabs */}
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">Semua</TabsTrigger>
          {Object.entries(CATEGORY_CONFIG).map(([value, cfg]) => {
            const Icon = cfg.icon;
            return (
              <TabsTrigger key={value} value={value} className="gap-1.5">
                <Icon className="size-3.5" />
                {cfg.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Thread list */}
      {threads === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {debouncedSearch || category !== "all" ? (
                <Search />
              ) : (
                <MessagesSquare />
              )}
            </EmptyMedia>
            <EmptyTitle>
              {debouncedSearch || category !== "all"
                ? "Tidak ada diskusi cocok"
                : "Belum ada diskusi"}
            </EmptyTitle>
            <EmptyDescription>
              {debouncedSearch || category !== "all"
                ? "Coba ubah kata kunci atau pilih kategori lain."
                : "Jadilah yang pertama memulai diskusi dengan tim."}
            </EmptyDescription>
          </EmptyHeader>
          {!debouncedSearch && category === "all" ? (
            <EmptyContent>
              <CreateThreadDialog />
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className="space-y-3">
          {threads.map((t) => (
            <ThreadCard key={t._id} thread={t} />
          ))}
        </div>
      )}
    </div>
  );
}
