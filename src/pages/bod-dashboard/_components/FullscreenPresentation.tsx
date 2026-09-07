import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Landmark, X, ChevronLeft, ChevronRight, Sun, Moon, type LucideIcon } from "lucide-react";
import PeriodSelector from "./PeriodSelector.tsx";
import { SlideThemeProvider } from "./PresentationSlides.tsx";

// ---- Types -----------------------------------------------------------------
export type TabSlideDef = {
  tabValue: string;
  tabLabel: string;
  tabIcon: LucideIcon;
  slides: Array<{ id: string; title: string; content: (period: string) => React.ReactNode }>;
};

type FullscreenPresentationProps = {
  tabs: TabSlideDef[];
  initialTab?: string;
  initialPeriod?: string;
  onClose: () => void;
};

// ---- Real-time clock -------------------------------------------------------
function LiveClock({ isDark }: { isDark: boolean }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  return (
    <div className="text-right leading-tight">
      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{dateStr}</p>
      <p className={`font-mono text-sm font-semibold tabular-nums ${isDark ? "text-white" : "text-gray-900"}`}>{timeStr}</p>
    </div>
  );
}

// ---- Period helpers --------------------------------------------------------
function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ---- Main component --------------------------------------------------------
export default function FullscreenPresentation({
  tabs, initialTab, initialPeriod, onClose,
}: FullscreenPresentationProps) {
  // Resolve initial tab index (fallback to first tab)
  const initialTabIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => t.tabValue === initialTab);
    return idx >= 0 ? idx : 0;
  }, [tabs, initialTab]);

  const [tabIndex, setTabIndex] = useState(initialTabIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  // direction: 1 = forward, -1 = backward (drives the slide animation)
  const [direction, setDirection] = useState<1 | -1>(1);
  const [period, setPeriod] = useState(initialPeriod ?? currentPeriod);
  const [isDark, setIsDark] = useState(true);

  const activeTab = tabs[tabIndex];
  const slides = activeTab?.slides ?? [];
  const activeSlide = slides[slideIndex];

  const goToTab = useCallback((nextIndex: number, dir: 1 | -1) => {
    if (nextIndex < 0 || nextIndex >= tabs.length) return;
    setDirection(dir);
    setTabIndex(nextIndex);
    setSlideIndex(0);
  }, [tabs.length]);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setSlideIndex((prev) => {
      if (prev < slides.length - 1) return prev + 1;
      // At last slide of tab → advance to next tab's first slide
      if (tabIndex < tabs.length - 1) {
        setTabIndex(tabIndex + 1);
        return 0;
      }
      return prev;
    });
  }, [slides.length, tabIndex, tabs.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setSlideIndex((prev) => {
      if (prev > 0) return prev - 1;
      // At first slide of tab → go to previous tab's last slide
      if (tabIndex > 0) {
        const prevTabIndex = tabIndex - 1;
        setTabIndex(prevTabIndex);
        return Math.max(0, tabs[prevTabIndex].slides.length - 1);
      }
      return prev;
    });
  }, [tabIndex, tabs]);

  // ---- Keyboard shortcuts --------------------------------------------------
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (e.ctrlKey) goToTab(tabIndex + 1, 1);
      else nextSlide();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (e.ctrlKey) goToTab(tabIndex - 1, -1);
      else prevSlide();
    }
  }, [onClose, goToTab, tabIndex, nextSlide, prevSlide]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!activeTab || !activeSlide) return null;

  const canPrevTab = tabIndex > 0;
  const canNextTab = tabIndex < tabs.length - 1;
  const animKey = `${activeTab.tabValue}-${activeSlide.id}`;

  return (
    <div className={`${isDark ? "dark" : ""} fixed inset-0 z-50 flex flex-col overflow-hidden ${isDark ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* ── Top bar ── */}
      <div className={`flex h-14 shrink-0 items-center gap-2 border-b ${isDark ? "border-gray-800 bg-gray-900/80 text-white" : "border-gray-200 bg-white/90 text-gray-900"} backdrop-blur px-3 lg:px-6`}>
        {/* Left: logo + title */}
        <div className="flex min-w-0 items-center gap-2 flex-1">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 ring-1 ring-blue-500/30">
            <Landmark className="size-4 text-blue-400" />
          </div>
          <div className="hidden sm:block min-w-0">
            <p className={`text-xs font-semibold tracking-tight leading-none truncate ${isDark ? "text-white" : "text-gray-900"}`}>Dashboard Direksi (BoD)</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Ringkasan Eksekutif · 25 Divisi</p>
          </div>
          {/* Tab pills — desktop only */}
          <div className="hidden lg:flex items-center gap-1 ml-3">
            {tabs.map((t, i) => {
              const TIcon = t.tabIcon;
              const isActive = i === tabIndex;
              return (
                <button
                  key={t.tabValue}
                  onClick={() => goToTab(i, i > tabIndex ? 1 : -1)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isDark
                        ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <TIcon className="size-3 shrink-0" />
                  <span>{t.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: period selector — hidden on xs, visible sm+ */}
        <div className={`hidden sm:block shrink-0 ${isDark
          ? "[&_label]:text-gray-400 [&_.text-muted-foreground]:text-gray-400 [&_button]:bg-gray-800 [&_button]:border-gray-700 [&_button]:text-white [&_button]:text-xs [&_button]:h-8"
          : "[&_label]:text-gray-500 [&_.text-muted-foreground]:text-gray-500 [&_button]:bg-white [&_button]:border-gray-300 [&_button]:text-gray-800 [&_button]:text-xs [&_button]:h-8"
        }`}>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {/* Clock — desktop only */}
        <div className="hidden lg:block shrink-0">
          <LiveClock isDark={isDark} />
        </div>

        {/* Right: toggle + close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsDark(d => !d)}
            aria-label={isDark ? "Mode Terang" : "Mode Gelap"}
            title={isDark ? "Mode Terang" : "Mode Gelap"}
            className={`flex size-8 cursor-pointer items-center justify-center rounded-lg ring-1 transition-colors ${
              isDark
                ? "bg-gray-800 text-yellow-300 ring-gray-700 hover:bg-gray-700"
                : "bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200"
            }`}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            onClick={onClose}
            aria-label="Keluar"
            className={`flex size-8 cursor-pointer items-center justify-center rounded-lg ring-1 transition-colors ${
              isDark
                ? "bg-gray-800 text-gray-300 ring-gray-700 hover:bg-red-800 hover:text-white"
                : "bg-gray-100 text-gray-600 ring-gray-200 hover:bg-red-100 hover:text-red-600"
            }`}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Period selector row — mobile only (xs) ── */}
      <div className={`sm:hidden flex items-center gap-2 px-3 py-2 border-b shrink-0 ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
        <div className={`flex-1 ${isDark
          ? "[&_label]:text-gray-400 [&_.text-muted-foreground]:text-gray-400 [&_button]:bg-gray-800 [&_button]:border-gray-700 [&_button]:text-white [&_button]:text-xs [&_button]:h-8"
          : "[&_label]:text-gray-500 [&_.text-muted-foreground]:text-gray-500 [&_button]:bg-white [&_button]:border-gray-300 [&_button]:text-gray-800 [&_button]:text-xs [&_button]:h-8"
        }`}>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* ── Section title band (judul tab/halaman seperti tampilan normal) ── */}
      <div className={`flex shrink-0 items-center gap-3 border-b px-4 py-3 lg:px-6 ${isDark ? "border-gray-800 bg-gray-900/60" : "border-gray-200 bg-white/80"}`}>
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-blue-500/15 ring-1 ring-blue-500/30" : "bg-blue-50 ring-1 ring-blue-200"}`}>
          <activeTab.tabIcon className={`size-5 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
        </div>
        <div className="min-w-0">
          <h2 className={`text-base font-bold leading-tight tracking-tight truncate lg:text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
            {activeTab.tabLabel}
          </h2>
          {activeSlide.title !== activeTab.tabLabel && (
            <p className={`text-xs leading-tight truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {activeSlide.title}
            </p>
          )}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="relative flex-1 overflow-hidden">
        <SlideThemeProvider isDark={isDark}>
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            <motion.div
              key={animKey}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <div className="h-full w-full overflow-auto">
                {activeSlide.content(period)}
              </div>
            </motion.div>
          </AnimatePresence>
        </SlideThemeProvider>
      </div>

      {/* ── Bottom bar ── */}
      <div className={`flex h-12 shrink-0 items-center justify-between border-t px-3 lg:px-6 ${isDark ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"}`}>
        {/* Left: tab navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => goToTab(tabIndex - 1, -1)}
            disabled={!canPrevTab}
            className={`flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"}`}
            aria-label="Tab sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className={`hidden text-xs sm:inline ${isDark ? "text-gray-400" : "text-gray-500"}`}>Ganti Tab</span>
          <button
            onClick={() => goToTab(tabIndex + 1, 1)}
            disabled={!canNextTab}
            className={`flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"}`}
            aria-label="Tab berikutnya"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Center: slide navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            className={`flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"}`}
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="min-w-0 text-center">
            <p className={`font-mono text-xs font-semibold tabular-nums ${isDark ? "text-white" : "text-gray-900"}`}>
              {slideIndex + 1} / {slides.length}
            </p>
            <p className={`truncate text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{activeSlide.title}</p>
          </div>
          <button
            onClick={nextSlide}
            className={`flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"}`}
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Right: keyboard hints — desktop only */}
        <div className={`hidden items-center gap-3 text-[11px] lg:flex ${isDark ? "text-gray-500" : "text-gray-400"}`}>
          <span className="flex items-center gap-1">
            <kbd className={`rounded border px-1.5 py-0.5 font-mono ${isDark ? "border-gray-700 bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-100 text-gray-600"}`}>&larr;</kbd>
            <kbd className={`rounded border px-1.5 py-0.5 font-mono ${isDark ? "border-gray-700 bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-100 text-gray-600"}`}>&rarr;</kbd>
            slide
          </span>
          <span className="flex items-center gap-1">
            <kbd className={`rounded border px-1.5 py-0.5 font-mono ${isDark ? "border-gray-700 bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-100 text-gray-600"}`}>Ctrl</kbd>
            +
            <kbd className={`rounded border px-1.5 py-0.5 font-mono ${isDark ? "border-gray-700 bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-100 text-gray-600"}`}>&larr;</kbd>
            <kbd className={`rounded border px-1.5 py-0.5 font-mono ${isDark ? "border-gray-700 bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-100 text-gray-600"}`}>&rarr;</kbd>
            tab
          </span>
        </div>
        {/* Right mobile: active tab label */}
        <div className={`lg:hidden text-right`}>
          <p className={`text-[10px] font-semibold truncate max-w-[80px] ${isDark ? "text-blue-400" : "text-blue-600"}`}>{activeTab.tabLabel}</p>
        </div>
      </div>
    </div>
  );
}
