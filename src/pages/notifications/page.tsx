import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Building2,
  BarChart3,
  CalendarCheck,
  Receipt,
  ScrollText,
  Megaphone,
  LifeBuoy,
  CheckCircle2,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner";

interface LocalNotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  readAt?: number | null;
  createdAt: number;
  timeLabel: string;
  actorName?: string;
  link?: string;
}

const INITIAL_MOCK_NOTIFICATIONS: LocalNotificationItem[] = [
  {
    id: "notif_1",
    title: "Ringkasan Aktivitas Mingguan",
    message: "Minggu ini: 1 notifikasi minggu ini, 1 belum dibaca. Terus semangat!",
    type: "activity_summary",
    readAt: null,
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
    timeLabel: "8 hari yang lalu",
  },
  {
    id: "notif_2",
    title: "Organisasi Trial Baru",
    message: "Anton membuat organisasi trial \"PT Antwi Digital Nusantara\" (paket P O C). Organisasi...",
    type: "org_trial",
    readAt: null,
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000 - 3600000,
    timeLabel: "8 hari yang lalu",
    actorName: "Anton",
  },
  {
    id: "notif_3",
    title: "Ringkasan Aktivitas Mingguan",
    message: "Minggu ini: 5 notifikasi minggu ini. Terus semangat!",
    type: "activity_summary",
    readAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    timeLabel: "15 hari yang lalu",
  },
  {
    id: "notif_4",
    title: "Pendaftaran Organisasi Baru",
    message: "EVANFIO WIROWAN mendaftarkan organisasi baru \"PT Starfa e-Office\".",
    type: "org_registration",
    readAt: Date.now() - 19 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    timeLabel: "20 hari yang lalu",
    actorName: "Evanfio",
  },
  {
    id: "notif_5",
    title: "Persetujuan Cuti Tahunan",
    message: "Pengajuan cuti Anda selama 2 hari (15-16 Agustus) telah disetujui oleh Supervisor.",
    type: "leave_reviewed",
    readAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    timeLabel: "1 bulan yang lalu",
    actorName: "HR Manager",
    link: "/leave",
  },
  {
    id: "notif_6",
    title: "Disposisi Surat Masuk",
    message: "Anda menerima disposisi surat masuk #SRT-2026-081 tentang 'Perpanjangan Kerjasama'.",
    type: "letter_disposition",
    readAt: Date.now() - 29 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
    timeLabel: "1 bulan yang lalu",
    link: "/letters",
  },
  {
    id: "notif_7",
    title: "Klaim Reimbursement Disetujui",
    message: "Klaim reimbursement sebesar Rp 450.000 untuk Biaya Operasional telah disetujui.",
    type: "reimbursement",
    readAt: Date.now() - 32 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 33 * 24 * 60 * 60 * 1000,
    timeLabel: "1 bulan yang lalu",
    link: "/expenses",
  },
];

function getIconMeta(type: string): { icon: LucideIcon; bg: string; color: string } {
  switch (type) {
    case "activity_summary":
      return { icon: BarChart3, bg: "bg-indigo-100 dark:bg-indigo-950/60", color: "text-indigo-600 dark:text-indigo-400" };
    case "org_trial":
    case "org_registration":
      return { icon: Building2, bg: "bg-amber-100 dark:bg-amber-950/60", color: "text-amber-600 dark:text-amber-400" };
    case "leave_reviewed":
      return { icon: CalendarCheck, bg: "bg-emerald-100 dark:bg-emerald-950/60", color: "text-emerald-600 dark:text-emerald-400" };
    case "reimbursement":
      return { icon: Receipt, bg: "bg-blue-100 dark:bg-blue-950/60", color: "text-blue-600 dark:text-blue-400" };
    case "letter_disposition":
      return { icon: ScrollText, bg: "bg-purple-100 dark:bg-purple-950/60", color: "text-purple-600 dark:text-purple-400" };
    case "announcement":
      return { icon: Megaphone, bg: "bg-rose-100 dark:bg-rose-950/60", color: "text-rose-600 dark:text-rose-400" };
    case "ticket":
      return { icon: LifeBuoy, bg: "bg-cyan-100 dark:bg-cyan-950/60", color: "text-cyan-600 dark:text-cyan-400" };
    default:
      return { icon: Bell, bg: "bg-slate-100 dark:bg-slate-800", color: "text-slate-600 dark:text-slate-400" };
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // State management with localStorage fallback
  const [notifications, setNotifications] = useState<LocalNotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem("starfa_notifications_list");
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_MOCK_NOTIFICATIONS;
  });

  // Convex Integration
  const convexNotifs = useQuery(api.notifications.listMine, { limit: 50 });
  const markAllReadMutation = useMutation(api.notifications.markAllRead);

  useEffect(() => {
    if (convexNotifs && convexNotifs.length > 0) {
      const mapped: LocalNotificationItem[] = convexNotifs.map((n) => ({
        id: n._id as string,
        title: n.title,
        message: n.message,
        type: n.type,
        readAt: n.readAt,
        createdAt: n._creationTime,
        timeLabel: new Date(n._creationTime).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        actorName: n.actor?.name,
        link: n.link,
      }));
      setNotifications(mapped);
    }
  }, [convexNotifs]);

  useEffect(() => {
    localStorage.setItem("starfa_notifications_list", JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const filteredList = notifications.filter((n) => {
    if (filter === "unread") return !n.readAt;
    return true;
  });

  const isAllSelected =
    filteredList.length > 0 && filteredList.every((n) => selectedIds.includes(n.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((n) => n.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || Date.now() }))
    );
    toast.success("Semua notifikasi ditandai sudah dibaca");
    try {
      await markAllReadMutation({});
    } catch {}
  };

  const handleDeleteAll = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua notifikasi?")) {
      setNotifications([]);
      setSelectedIds([]);
      toast.success("Semua notifikasi berhasil dihapus");
    }
  };

  const handleMarkSelectedRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (selectedIds.includes(n.id) ? { ...n, readAt: n.readAt || Date.now() } : n))
    );
    setSelectedIds([]);
    toast.success("Notifikasi terpilih ditandai sudah dibaca");
  };

  const handleDeleteSelected = () => {
    setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
    setSelectedIds([]);
    toast.success("Notifikasi terpilih telah dihapus");
  };

  const handleNotificationClick = (item: LocalNotificationItem) => {
    if (!item.readAt) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: Date.now() } : n))
      );
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    toast.success("Notifikasi dihapus");
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* 1. Header Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Pusat Notifikasi
        </h1>
        <p className="text-sm text-muted-foreground">
          Semua aktivitas penting untuk Anda ·{" "}
          <span className="font-semibold text-primary">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
          </span>
        </p>
      </div>

      {/* 2. Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => navigate("/notification-settings")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted rounded-lg transition-colors border border-border/80 cursor-pointer"
        >
          <Settings className="size-3.5 text-muted-foreground" />
          <span>Pengaturan</span>
        </button>

        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 rounded-lg transition-colors border border-border/80 cursor-pointer"
        >
          <CheckCheck className="size-3.5 text-emerald-600" />
          <span>Tandai semua dibaca</span>
        </button>

        <button
          type="button"
          onClick={handleDeleteAll}
          disabled={notifications.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="size-3.5 text-rose-600" />
          <span>Hapus semua</span>
        </button>
      </div>

      {/* 3. Filter Tabs */}
      <div className="pt-2">
        <div className="inline-flex items-center p-1 bg-muted/70 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              filter === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Semua
          </button>

          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              filter === "unread"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Belum dibaca</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-700 text-foreground">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. Select All Checkbox Row */}
      {filteredList.length > 0 && (
        <div className="flex items-center justify-between pt-2 pb-1 text-xs text-muted-foreground">
          <label className="inline-flex items-center gap-2 cursor-pointer font-medium hover:text-foreground select-none">
            <Checkbox checked={isAllSelected} onCheckedChange={handleToggleSelectAll} />
            <span>Pilih semua ({filteredList.length})</span>
          </label>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkSelectedRead}
                className="h-7 text-xs text-primary font-medium"
              >
                <CheckCircle2 className="size-3.5 mr-1" />
                Tandai dibaca ({selectedIds.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteSelected}
                className="h-7 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="size-3.5 mr-1" />
                Hapus ({selectedIds.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 5. Notification Cards List */}
      <div className="space-y-3 pt-1">
        {filteredList.length === 0 ? (
          <div className="text-center py-14 border border-dashed rounded-2xl bg-card/40 space-y-3">
            <Bell className="size-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">
              {filter === "unread" ? "Tidak ada notifikasi yang belum dibaca." : "Belum ada notifikasi saat ini."}
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isUnread = !item.readAt;
            const isSelected = selectedIds.includes(item.id);
            const { icon: ItemIcon, bg, color } = getIconMeta(item.type);

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={cn(
                  "group relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer",
                  isUnread
                    ? "bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300"
                    : "bg-card hover:bg-muted/30 border-border/60",
                  isSelected && "ring-2 ring-primary/40 bg-primary/5"
                )}
              >
                {/* Checkbox */}
                <div className="pt-0.5" onClick={(e) => handleToggleSelect(item.id, e)}>
                  <Checkbox checked={isSelected} />
                </div>

                {/* Icon Box */}
                <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5", bg, color)}>
                  <ItemIcon className="size-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className={cn("text-sm tracking-tight", isUnread ? "font-bold text-foreground" : "font-semibold text-foreground/90")}>
                      {item.title}
                    </h3>
                    {isUnread && (
                      <span className="size-2 rounded-full bg-blue-600 shrink-0 inline-block ml-0.5" title="Belum dibaca" />
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 font-medium">
                    <span>{item.timeLabel}</span>
                    {item.actorName && (
                      <span className="text-muted-foreground/90">oleh {item.actorName}</span>
                    )}
                  </div>
                </div>

                {/* Trash icon on hover */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all absolute top-3.5 right-3.5 cursor-pointer"
                  title="Hapus notifikasi"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
