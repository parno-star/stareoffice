import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuth } from "@/hooks/use-auth.ts";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import {
  ArrowRight,
  LayoutDashboard,
  Navigation,
  Hash,
} from "lucide-react";
import BannerCarousel from "./_components/BannerCarousel.tsx";
import CompanyValues from "./_components/CompanyValues.tsx";
import QuickShortcuts from "./_components/QuickShortcuts.tsx";
import QuickStats from "./_components/QuickStats.tsx";

export default function HomePage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const content = useQuery(api.welcomePage.getContent, {});
  const tourProgress = useQuery(api.tourProgress.getMyProgress, {});
  const resetTour = useMutation(api.tourProgress.resetTour);

  if (content === undefined || currentUser === undefined) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const displayName = currentUser?.name ?? authUser?.profile.name ?? "Karyawan";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Selamat Pagi" : hour < 17 ? "Selamat Siang" : "Selamat Malam";

  const handleStartTour = async () => {
    if (tourProgress?.tourCompleted) {
      await resetTour({});
    }
    // Tour will auto-start via the ProductTour component
    navigate("/dashboard");
  };

  return (
    <div className="space-y-8 p-4 lg:p-6 pb-12">
      {/* Hero Welcome Banner – compact */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.05),transparent)]" />

          <div className="relative flex items-start gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:gap-8 lg:px-8 lg:py-9">
            {/* Profile avatar – left side */}
            <motion.div
              className="flex shrink-0 items-start lg:items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
            >
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-full bg-white/10 backdrop-blur-sm" />
                {(currentUser?.avatarUrl || (typeof authUser?.profile.avatar === "string" && authUser.profile.avatar)) ? (
                  <img
                    src={currentUser?.avatarUrl ?? (typeof authUser?.profile.avatar === "string" ? authUser.profile.avatar : "")}
                    alt={displayName}
                    className="relative size-14 sm:size-16 lg:size-20 rounded-full object-cover ring-2 ring-white/25"
                  />
                ) : (
                  <div className="relative flex size-14 sm:size-16 lg:size-20 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/25">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white/90">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 size-3.5 lg:size-4 rounded-full bg-emerald-400 ring-2 ring-primary" />
              </div>
            </motion.div>

            {/* Text content */}
            <div className="flex flex-1 flex-col justify-between">
              <div className="space-y-2.5">
              {/* App name – top line */}
              <motion.p
                className="font-[Montserrat] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] opacity-70"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.7, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                Star e-Office
              </motion.p>

              {/* Greeting + Welcome + Organization */}
              <motion.h1
                className="font-[Montserrat] font-extrabold leading-[1.3] tracking-tight"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
              >
                <span className="block text-base sm:text-lg lg:text-xl">
                  {greeting}, {displayName}
                </span>
                <span className="block text-sm sm:text-base lg:text-lg opacity-70 mt-0.5">
                  Selamat Datang di
                </span>
                <span className="block text-sm sm:text-base lg:text-lg opacity-90">
                  e-Office {content.organizationName || "Organisasi"}
                </span>
              </motion.h1>

              {/* Accent divider */}
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                style={{ transformOrigin: "left" }}
              >
                <div className="h-[2px] w-8 rounded-full bg-white/50" />
                <div className="h-[2px] w-3 rounded-full bg-white/25" />
              </motion.div>

              {/* Slogan */}
              {content.slogan && (
                <motion.p
                  className="font-serif text-xs opacity-50 italic max-w-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.45 }}
                >
                  {`"${content.slogan}"`}
                </motion.p>
              )}
              </div>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-wrap items-center gap-2 pt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
              >
                <Button
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="bg-white/15 hover:bg-white/25 text-primary-foreground border border-white/10 gap-1.5 cursor-pointer backdrop-blur-sm text-xs"
                >
                  <LayoutDashboard className="size-3.5" />
                  Buka Dashboard
                  <ArrowRight className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleStartTour}
                  className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 gap-1.5 cursor-pointer text-xs"
                >
                  <Navigation className="size-3.5" />
                  Mulai Tour
                </Button>
              </motion.div>
            </div>

            {/* Organization logo – right side on desktop */}
            {content.organizationLogo && (
              <motion.div
                className="hidden lg:flex shrink-0 items-center justify-center"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 rounded-xl bg-white/5 backdrop-blur-sm" />
                  <img
                    src={content.organizationLogo}
                    alt={content.organizationName}
                    className="relative size-16 rounded-xl object-cover ring-2 ring-white/15 xl:size-20"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Spotlight / Hashtags */}
      {content.spotlightText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 justify-center"
        >
          <Hash className="size-4 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            {content.spotlightText}
          </p>
        </motion.div>
      )}

      {/* Banner Carousel – Sorotan & Kegiatan */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Sorotan & Kegiatan
        </h2>
        <BannerCarousel slides={content.bannerSlides} settings={content.carouselSettings} />
      </section>

      {/* Company Values – Nilai-Nilai Perusahaan */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Nilai-Nilai Perusahaan
        </h2>
        <CompanyValues values={content.values} />
      </section>

      {/* Quick Stats – Ringkasan */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Ringkasan
        </h2>
        <QuickStats />
      </section>

      {/* Quick Shortcuts – Akses Cepat */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Akses Cepat
        </h2>
        <QuickShortcuts />
      </section>
    </div>
  );
}
