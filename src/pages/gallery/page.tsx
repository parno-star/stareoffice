import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Images } from "lucide-react";
import AlbumCard from "./_components/AlbumCard.tsx";
import CreateAlbumDialog from "./_components/CreateAlbumDialog.tsx";

export default function GalleryPage() {
  const albums = useQuery(api.gallery.listAlbums, {});

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Galeri Kegiatan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kenangan indah dari berbagai kegiatan perusahaan.
          </p>
        </div>
        <CreateAlbumDialog />
      </div>

      {/* Content */}
      {albums === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Images />
            </EmptyMedia>
            <EmptyTitle>Belum ada album</EmptyTitle>
            <EmptyDescription>
              Buat album pertama untuk mendokumentasikan kegiatan perusahaan.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateAlbumDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <AlbumCard key={album._id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
}
