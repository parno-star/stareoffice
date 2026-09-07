import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  BookOpen,
  FileText,
  FolderPlus,
  Plus,
  Search,
  TrendingUp,
  Users,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useDebounce } from "@/hooks/use-debounce.ts";
import SpaceCard from "@/pages/wiki/_components/SpaceCard.tsx";
import ArticleCard from "@/pages/wiki/_components/ArticleCard.tsx";
import SpaceFormDialog from "@/pages/wiki/_components/SpaceFormDialog.tsx";
import ArticleFormDialog from "@/pages/wiki/_components/ArticleFormDialog.tsx";

export default function WikiPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const spaces = useQuery(api.wiki.listSpaces, {});
  const stats = useQuery(api.wiki.getStats, {});
  const recent = useQuery(api.wiki.listRecent, { limit: 6 });
  const popular = useQuery(api.wiki.listPopular, { limit: 5 });
  const tags = useQuery(api.wiki.listTags, {});
  const searchResults = useQuery(
    api.wiki.listArticles,
    debouncedSearch.trim().length > 0 || activeTag
      ? {
          search: debouncedSearch.trim() || undefined,
          tag: activeTag ?? undefined,
        }
      : "skip",
  );

  const isSearching = debouncedSearch.trim().length > 0 || activeTag !== null;

  const statCards = [
    {
      icon: BookOpen,
      label: "Space",
      value: stats?.spaceCount ?? 0,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      icon: FileText,
      label: "Artikel",
      value: stats?.articleCount ?? 0,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Users,
      label: "Kontributor",
      value: stats?.contributorCount ?? 0,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      icon: Eye,
      label: "Total dilihat",
      value: stats?.totalViews ?? 0,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Wiki & Basis Pengetahuan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tempat menyimpan panduan, kebijakan, dan pengetahuan tim
          </p>
        </div>
        <div className="flex w-full gap-2 md:w-auto">
          <SpaceFormDialog
            trigger={
              <Button variant="secondary" className="gap-2">
                <FolderPlus className="size-4" />
                Space baru
              </Button>
            }
          />
          <ArticleFormDialog
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Tulis artikel
              </Button>
            }
            onSaved={(id) => {
              navigate(`/wiki/article/${id}`);
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3">
              <div
                className={`flex size-11 items-center justify-center rounded-xl ${s.color}`}
              >
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value.toLocaleString("id-ID")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari artikel di seluruh wiki..."
          className="pl-9"
        />
      </div>

      {/* Tags */}
      {tags && tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tag populer:
          </span>
          <Badge
            variant={activeTag === null ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setActiveTag(null)}
          >
            Semua
          </Badge>
          {tags.slice(0, 12).map((tag) => (
            <Badge
              key={tag}
              variant={activeTag === tag ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {isSearching ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            {debouncedSearch.trim()
              ? `Hasil pencarian "${debouncedSearch.trim()}"`
              : `Artikel dengan tag #${activeTag}`}
          </h2>
          {searchResults === undefined ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>Tidak ada hasil</EmptyTitle>
                <EmptyDescription>
                  Coba kata kunci lain atau buat artikel baru.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((a) => (
                <ArticleCard
                  key={a._id}
                  article={a}
                  onClick={() => navigate(`/wiki/article/${a._id}`)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <Tabs defaultValue="spaces">
          <TabsList>
            <TabsTrigger value="spaces">Space</TabsTrigger>
            <TabsTrigger value="recent">Terbaru</TabsTrigger>
            <TabsTrigger value="popular">Populer</TabsTrigger>
          </TabsList>

          {/* Spaces */}
          <TabsContent value="spaces" className="mt-4">
            {spaces === undefined ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : spaces.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpen />
                  </EmptyMedia>
                  <EmptyTitle>Belum ada space</EmptyTitle>
                  <EmptyDescription>
                    Buat space pertama untuk mengelompokkan artikel Anda.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <SpaceFormDialog
                    trigger={
                      <Button size="sm" className="gap-2">
                        <FolderPlus className="size-4" />
                        Buat space
                      </Button>
                    }
                  />
                </EmptyContent>
              </Empty>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {spaces.map((s) => (
                  <SpaceCard
                    key={s._id}
                    space={s}
                    onClick={() => navigate(`/wiki/space/${s._id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recent */}
          <TabsContent value="recent" className="mt-4">
            {recent === undefined ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText />
                  </EmptyMedia>
                  <EmptyTitle>Belum ada artikel</EmptyTitle>
                  <EmptyDescription>
                    Mulai menulis untuk berbagi pengetahuan dengan tim.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <ArticleFormDialog
                    trigger={
                      <Button size="sm" className="gap-2">
                        <Plus className="size-4" />
                        Tulis artikel
                      </Button>
                    }
                    onSaved={(id) => navigate(`/wiki/article/${id}`)}
                  />
                </EmptyContent>
              </Empty>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recent.map((a) => (
                  <ArticleCard
                    key={a._id}
                    article={a}
                    onClick={() => navigate(`/wiki/article/${a._id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Popular */}
          <TabsContent value="popular" className="mt-4">
            {popular === undefined ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : popular.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TrendingUp />
                  </EmptyMedia>
                  <EmptyTitle>Belum ada data</EmptyTitle>
                  <EmptyDescription>
                    Artikel populer akan tampil setelah ada pembaca.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {popular.map((a) => (
                  <ArticleCard
                    key={a._id}
                    article={a}
                    onClick={() => navigate(`/wiki/article/${a._id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
