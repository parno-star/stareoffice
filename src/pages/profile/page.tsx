import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuth } from "@/hooks/use-auth.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { motion } from "motion/react";
import {
  Camera,
  Trash2,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Upload,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  FileText,
  Cake,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import SignaturePad from "@/pages/letters/_components/SignaturePad.tsx";

/* ------------------------------------------------------------------ */
/*  Crop Editor                                                        */
/* ------------------------------------------------------------------ */

const CROP_SIZE = 260;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const GRID_LINES = 3;

type CropState = { x: number; y: number; zoom: number };

function CropGrid() {
  const lines = [];
  for (let i = 1; i < GRID_LINES; i++) {
    const pct = `${(i / GRID_LINES) * 100}%`;
    lines.push(
      <line key={`h-${i}`} x1="0%" y1={pct} x2="100%" y2={pct} stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />,
      <line key={`v-${i}`} x1={pct} y1="0%" x2={pct} y2="100%" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />,
    );
  }
  return (
    <svg
      className="pointer-events-none absolute"
      style={{ width: CROP_SIZE, height: CROP_SIZE, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      viewBox={`0 0 ${CROP_SIZE} ${CROP_SIZE}`}
    >
      {lines}
    </svg>
  );
}

function AvatarCropEditor({
  imageSrc,
  onConfirm,
  onCancel,
  uploading,
}: {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  uploading: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, zoom: 1 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      imgRef.current = img;
      const minDim = Math.min(img.naturalWidth, img.naturalHeight);
      setCrop({ x: 0, y: 0, zoom: Math.max(CROP_SIZE / minDim, MIN_ZOOM) });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const clampPosition = useCallback(
    (x: number, y: number, zoom: number) => {
      if (!imgSize.w || !imgSize.h) return { x, y };
      const maxX = Math.max(0, (imgSize.w * zoom - CROP_SIZE) / 2);
      const maxY = Math.max(0, (imgSize.h * zoom - CROP_SIZE) / 2);
      return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
    },
    [imgSize],
  );

  const clampRef = useRef(clampPosition);
  clampRef.current = clampPosition;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch" && !e.isPrimary) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setCrop((prev) => ({ ...prev, ...clampPosition(prev.x + dx, prev.y + dy, prev.zoom) }));
    },
    [clampPosition],
  );

  const handlePointerUp = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !imgLoaded) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCrop((prev) => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom + (e.deltaY > 0 ? -0.15 : 0.15)));
        return { ...clampRef.current(prev.x, prev.y, newZoom), zoom: newZoom };
      });
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDist.current !== null) {
          const scale = dist / lastPinchDist.current;
          setCrop((prev) => {
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * scale));
            return { ...clampRef.current(prev.x, prev.y, newZoom), zoom: newZoom };
          });
        }
        lastPinchDist.current = dist;
      }
    };
    const onTouchEnd = () => { lastPinchDist.current = null; };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [imgLoaded]);

  const handleSliderZoom = useCallback(
    (values: number[]) => {
      const z = values[0];
      setCrop((prev) => ({ ...clampPosition(prev.x, prev.y, z), zoom: z }));
    },
    [clampPosition],
  );

  const handleCrop = useCallback(() => {
    if (!imgRef.current) return;
    const canvas = document.createElement("canvas");
    const out = 512;
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imgRef.current;
    const centerX = (img.naturalWidth * crop.zoom) / 2 - crop.x;
    const centerY = (img.naturalHeight * crop.zoom) / 2 - crop.y;
    const srcSize = CROP_SIZE / crop.zoom;
    ctx.beginPath();
    ctx.arc(out / 2, out / 2, out / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, centerX / crop.zoom - srcSize / 2, centerY / crop.zoom - srcSize / 2, srcSize, srcSize, 0, 0, out, out);
    canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, "image/jpeg", 0.9);
  }, [crop, onConfirm]);

  if (!imgLoaded) {
    return <div className="flex h-72 items-center justify-center"><Spinner className="size-8" /></div>;
  }

  const cs = CROP_SIZE + 40;
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="relative cursor-grab overflow-hidden rounded-xl bg-black active:cursor-grabbing"
        style={{ width: cs, height: cs, touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={imageSrc}
          alt="Crop"
          draggable={false}
          className="pointer-events-none absolute select-none"
          style={{
            width: imgSize.w * crop.zoom,
            height: imgSize.h * crop.zoom,
            left: `calc(50% - ${(imgSize.w * crop.zoom) / 2 - crop.x}px)`,
            top: `calc(50% - ${(imgSize.h * crop.zoom) / 2 - crop.y}px)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle ${CROP_SIZE / 2}px at center, transparent ${CROP_SIZE / 2 - 1}px, rgba(0,0,0,0.55) ${CROP_SIZE / 2}px)` }} />
        <CropGrid />
        <div className="pointer-events-none absolute rounded-full border-2 border-white/50" style={{ width: CROP_SIZE, height: CROP_SIZE, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
        {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Spinner className="size-8 text-white" /></div>}
      </div>
      <div className="flex w-full max-w-[260px] items-center gap-3">
        <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
        <Slider min={MIN_ZOOM} max={MAX_ZOOM} step={0.05} value={[crop.zoom]} onValueChange={handleSliderZoom} className="flex-1" />
        <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={uploading}>Batal</Button>
        <Button size="sm" onClick={handleCrop} disabled={uploading} className="gap-2">
          {uploading ? <><Spinner className="size-4" />Mengunggah...</> : <><Upload className="size-4" />Upload Foto</>}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile Edit Page                                                  */
/* ------------------------------------------------------------------ */

type FieldRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  options?: string[];
};

const EMPTY_OPTION = "__empty__";

function FieldRow({ icon, label, value, onChange, placeholder, type = "text", multiline, options }: FieldRowProps) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </Label>
      {options ? (
        <Select
          value={value ? value : EMPTY_OPTION}
          onValueChange={(val) => onChange(val === EMPTY_OPTION ? "" : val)}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder={placeholder ?? "Pilih"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_OPTION}>-- Tidak ada --</SelectItem>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="resize-none"
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function ProfileEditContent() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const pendingChange = useQuery(api.users.getMyPendingProfileChange, {});
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateMyAvatar = useMutation(api.users.updateMyAvatar);
  const removeMyAvatar = useMutation(api.users.removeMyAvatar);
  const updateMyProfile = useMutation(api.users.updateMyProfile);
  const updateMySignature = useMutation(api.users.updateMySignature);
  const positionDirectory = useQuery(api.positionDirectory.list, {});

  // Roles that edit directly without HR approval
  const directEditRoles = ["super_admin", "admin", "hr_manager"];
  const needsApproval = !directEditRoles.includes(currentUser?.role ?? "");

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");
  const [birthday, setBirthday] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize form from currentUser
  useEffect(() => {
    if (currentUser && !initialized) {
      setName(currentUser.name ?? "");
      setPhone(currentUser.phone ?? "");
      setLocation(currentUser.location ?? "");
      setJobTitle(currentUser.jobTitle ?? "");
      setDepartment(currentUser.department ?? "");
      setBio(currentUser.bio ?? "");
      setBirthday(currentUser.birthday ?? "");
      setDateOfBirth(currentUser.dateOfBirth ?? "");
      setStartDate(currentUser.startDate ?? "");
      setInitialized(true);
    }
  }, [currentUser, initialized]);

  const displayName = currentUser?.name ?? authUser?.profile.name ?? "U";

  // Source job title options from the "Nama Jabatan" master data
  const jobTitleOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of positionDirectory ?? []) {
      if (p.isActive && p.fullName.trim()) set.add(p.fullName.trim());
    }
    if (jobTitle.trim()) set.add(jobTitle.trim());
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "id", { sensitivity: "base" }),
    );
  }, [positionDirectory, jobTitle]);
  const avatarUrl =
    currentUser?.avatarUrl ??
    (typeof authUser?.profile.avatar === "string" ? authUser.profile.avatar : null);
  const email = currentUser?.email ?? authUser?.profile.email ?? "";

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Hanya file gambar yang diperbolehkan"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran file maksimal 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setPreview(reader.result as string); setCropDialogOpen(true); };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleCropConfirm = useCallback(
    async (blob: Blob) => {
      setUploading(true);
      try {
        const uploadUrl = await generateUploadUrl({});
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
        const { storageId } = (await result.json()) as { storageId: string };
        await updateMyAvatar({ storageId: storageId as unknown as Parameters<typeof updateMyAvatar>[0]["storageId"] });
        toast.success("Foto profil berhasil diperbarui");
        setCropDialogOpen(false);
        setPreview(null);
      } catch (error) {
        if (error instanceof ConvexError) {
          const data = error.data as { message?: string };
          toast.error(data.message ?? "Gagal mengunggah foto");
        } else {
          toast.error("Gagal mengunggah foto");
        }
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl, updateMyAvatar],
  );

  const handleRemoveAvatar = useCallback(async () => {
    try {
      await removeMyAvatar();
      toast.success("Foto profil dihapus");
    } catch {
      toast.error("Gagal menghapus foto profil");
    }
  }, [removeMyAvatar]);

  const handleSaveSignature = useCallback(
    async (data: string) => {
      setSavingSignature(true);
      try {
        await updateMySignature({ signatureData: data });
        toast.success("Tanda tangan berhasil disimpan");
        setSignatureDialogOpen(false);
      } catch (error) {
        if (error instanceof ConvexError) {
          const d = error.data as { message?: string };
          toast.error(d.message ?? "Gagal menyimpan tanda tangan");
        } else {
          toast.error("Gagal menyimpan tanda tangan");
        }
      } finally {
        setSavingSignature(false);
      }
    },
    [updateMySignature],
  );

  const handleRemoveSignature = useCallback(async () => {
    try {
      await updateMySignature({ signatureData: undefined });
      toast.success("Tanda tangan dihapus");
    } catch {
      toast.error("Gagal menghapus tanda tangan");
    }
  }, [updateMySignature]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateMyProfile({
        name: name || undefined,
        phone: phone || undefined,
        location: location || undefined,
        jobTitle: jobTitle || undefined,
        department: department || undefined,
        bio: bio || undefined,
        birthday: birthday || undefined,
        dateOfBirth: dateOfBirth || undefined,
        startDate: startDate || undefined,
      });
      toast.success(
        needsApproval
          ? "Permintaan perubahan dikirim ke HR Manager untuk verifikasi"
          : "Profil berhasil disimpan",
      );
      navigate(-1);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menyimpan profil");
      } else {
        toast.error("Gagal menyimpan profil");
      }
    } finally {
      setSaving(false);
    }
  }, [name, phone, location, jobTitle, department, bio, birthday, dateOfBirth, startDate, updateMyProfile, navigate, needsApproval]);

  if (currentUser === undefined) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-6 p-4 lg:p-6">
        <Skeleton className="mx-auto size-28 rounded-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg p-4 pb-24 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 cursor-pointer">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold">Edit Profil</h1>
      </div>

      {/* Pending / reviewed status banner */}
      {needsApproval && pendingChange && (
        <div className="mb-4">
          <ProfileChangeStatusBanner
            status={pendingChange.status}
            changes={pendingChange.changes}
            rejectionReason={pendingChange.rejectionReason}
          />
        </div>
      )}

      {/* Info notice for employees whose changes require approval */}
      {needsApproval && !(pendingChange && pendingChange.status === "pending") && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Perubahan data profil Anda memerlukan persetujuan HR Manager. Data lama tetap berlaku sampai perubahan disetujui.
          </span>
        </div>
      )}

      {/* Avatar section */}
      <motion.div
        className="mb-8 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
      >
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="size-28 rounded-full object-cover ring-4 ring-muted"
            />
          ) : (
            <div className="flex size-28 items-center justify-center rounded-full bg-muted ring-4 ring-muted">
              <span className="text-4xl font-bold text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Camera button overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            <Camera className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer text-sm font-medium text-primary hover:underline"
          >
            Ganti Foto
          </button>
          {avatarUrl && (
            <>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="cursor-pointer text-sm font-medium text-destructive hover:underline"
              >
                Hapus
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" as const }}
      >
        <Card>
          <CardContent className="space-y-5 p-5">
            <FieldRow icon={<User className="size-3.5" />} label="Nama" value={name} onChange={setName} placeholder="Nama lengkap" />
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="size-3.5" />
                Email
              </Label>
              <Input value={email} disabled className="bg-muted/50" />
            </div>
            <FieldRow icon={<Phone className="size-3.5" />} label="Telepon" value={phone} onChange={setPhone} placeholder="+62812xxxx" type="tel" />
            <FieldRow icon={<MapPin className="size-3.5" />} label="Lokasi" value={location} onChange={setLocation} placeholder="Jakarta, Indonesia" />
            <FieldRow icon={<Briefcase className="size-3.5" />} label="Jabatan" value={jobTitle} onChange={setJobTitle} placeholder="Pilih jabatan" options={jobTitleOptions} />
            <FieldRow icon={<Building2 className="size-3.5" />} label="Departemen" value={department} onChange={setDepartment} placeholder="Engineering" />
            <FieldRow icon={<FileText className="size-3.5" />} label="Bio" value={bio} onChange={setBio} placeholder="Ceritakan sedikit tentang Anda..." multiline />
            <FieldRow icon={<Cake className="size-3.5" />} label="Ulang Tahun (MM-DD)" value={birthday} onChange={setBirthday} placeholder="01-15" />
            <FieldRow icon={<Cake className="size-3.5" />} label="Tanggal Lahir (YYYY-MM-DD)" value={dateOfBirth} onChange={setDateOfBirth} placeholder="1990-01-15" />
            <FieldRow icon={<CalendarDays className="size-3.5" />} label="Tanggal Mulai Kerja (YYYY-MM-DD)" value={startDate} onChange={setStartDate} placeholder="2024-01-01" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Digital signature (default) section */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" as const }}
      >
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <PenLine className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Tanda Tangan Digital</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Tanda tangan ini otomatis muncul pada surat resmi di mana Anda menjadi <span className="font-medium">pengirim</span>. Anda tidak perlu menandatangani setiap surat satu per satu.
            </p>
            {currentUser?.defaultSignature ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center rounded-lg border bg-white p-3">
                  <img
                    src={currentUser.defaultSignature}
                    alt="Tanda tangan default"
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="cursor-pointer gap-1.5"
                    onClick={() => setSignatureDialogOpen(true)}
                  >
                    <PenLine className="size-3.5" />
                    Perbarui
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => void handleRemoveSignature()}
                  >
                    <Trash2 className="size-3.5" />
                    Hapus
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="cursor-pointer gap-1.5"
                onClick={() => setSignatureDialogOpen(true)}
              >
                <PenLine className="size-3.5" />
                Tambah Tanda Tangan
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Save button */}
      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving} className="w-full cursor-pointer gap-2">
          {saving
            ? <><Spinner className="size-4" />Menyimpan...</>
            : needsApproval
              ? "Kirim untuk Verifikasi HR"
              : "Simpan Perubahan"}
        </Button>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Crop dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => { if (!open) { setCropDialogOpen(false); setPreview(null); } }}>
        <DialogContent className="max-w-sm overflow-hidden p-0">
          <DialogHeader className="px-5 pb-0 pt-5">
            <DialogTitle className="text-base">Edit Foto Profil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 px-4 pb-5 pt-3">
            {preview && (
              <AvatarCropEditor
                imageSrc={preview}
                onConfirm={handleCropConfirm}
                onCancel={() => { setCropDialogOpen(false); setPreview(null); }}
                uploading={uploading}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={(open) => { if (!savingSignature) setSignatureDialogOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tanda Tangan Digital</DialogTitle>
          </DialogHeader>
          <SignaturePad
            showRole={false}
            onSave={(data) => { void handleSaveSignature(data); }}
            onCancel={() => setSignatureDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-lg space-y-6 p-4 lg:p-6">
          <Skeleton className="mx-auto size-28 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex min-h-[50vh] items-center justify-center">
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <ProfileEditContent />
      </Authenticated>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile change status banner (pending / approved / rejected)       */
/* ------------------------------------------------------------------ */

const STATUS_FIELD_LABELS: Record<string, string> = {
  name: "Nama",
  jobTitle: "Jabatan",
  department: "Departemen",
  phone: "Telepon",
  location: "Lokasi",
  bio: "Tentang Saya",
  birthday: "Ulang Tahun",
  dateOfBirth: "Tanggal Lahir",
  startDate: "Mulai Bekerja",
};

function ProfileChangeStatusBanner({
  status,
  changes,
  rejectionReason,
}: {
  status: string;
  changes: Record<string, string>;
  rejectionReason?: string;
}) {
  const fields = Object.keys(changes)
    .map((k) => STATUS_FIELD_LABELS[k] ?? k)
    .join(", ");

  if (status === "pending") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
        <Clock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Menunggu verifikasi HR Manager
          </p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
            Perubahan yang diajukan: {fields}. Data lama masih berlaku sampai disetujui.
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
        <XCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Perubahan ditolak
          </p>
          {rejectionReason && (
            <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
              Alasan: {rejectionReason}
            </p>
          )}
          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
            Silakan perbarui data dan kirim kembali untuk verifikasi.
          </p>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/40">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Perubahan terakhir disetujui
          </p>
          <p className="mt-0.5 text-xs text-green-700 dark:text-green-300">
            Data profil Anda telah diperbarui sesuai permintaan.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
