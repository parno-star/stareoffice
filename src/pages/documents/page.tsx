import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { isAdminRole } from "@/convex/roles.ts";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { FolderOpen, Search, FileText } from "lucide-react";
import UploadDocumentDialog from "./_components/UploadDocumentDialog.tsx";
import DocumentCard from "./_components/DocumentCard.tsx";
import { CATEGORY_CONFIG } from "./_lib/document-utils.ts";
import { DataAccessBanner } from "@/components/DataAccessBanner.tsx";

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [debouncedSearch] = useDebounce(search, 300);

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const documents = useQuery(api.documents.list, {
    search: debouncedSearch,
    category,
  });

  const isAdmin = isAdminRole(currentUser?.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Dokumen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pusat dokumen perusahaan: kebijakan, SOP, formulir, dan template.
          </p>
        </div>
        <UploadDocumentDialog />
      </div>

      <DataAccessBanner category="documents" />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari dokumen berdasarkan judul..."
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
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

      {/* Document list */}
      {documents === undefined ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {debouncedSearch || category !== "all" ? (
                <Search />
              ) : (
                <FolderOpen />
              )}
            </EmptyMedia>
            <EmptyTitle>
              {debouncedSearch || category !== "all"
                ? "Tidak ada dokumen cocok"
                : "Belum ada dokumen"}
            </EmptyTitle>
            <EmptyDescription>
              {debouncedSearch || category !== "all"
                ? "Coba ubah pencarian atau filter kategori."
                : "Unggah dokumen pertama untuk mulai membangun pusat dokumen perusahaan."}
            </EmptyDescription>
          </EmptyHeader>
          {!debouncedSearch && category === "all" ? (
            <EmptyContent>
              <UploadDocumentDialog />
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" />
            <span>
              {documents.length} dokumen
              {documents.length >= 200 ? " (menampilkan 200 terbaru)" : ""}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {documents.map((doc) => (
              <DocumentCard
                key={doc._id}
                document={doc}
                canDelete={
                  isAdmin ||
                  (currentUser !== null &&
                    currentUser !== undefined &&
                    doc.uploaderId === currentUser._id)
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
