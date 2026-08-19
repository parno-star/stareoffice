import { Card, CardContent } from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { LayoutGrid, Send, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WelcomeCardProps {
  name: string;
  avatarUrl?: string | null;
  slogan?: string;
  onStartTour?: () => void;
  onOpenDashboard?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function WelcomeCard({
  name,
  avatarUrl,
  slogan = "Bersama Membangun Masa Depan Digital",
  onStartTour,
  onOpenDashboard,
}: WelcomeCardProps) {
  const navigate = useNavigate();
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

  const handleOpenDashboard = () => {
    if (onOpenDashboard) {
      onOpenDashboard();
    } else {
      navigate("/directory");
    }
  };

  const handleStartTour = () => {
    if (onStartTour) {
      onStartTour();
    } else {
      // Trigger product tour event or navigation
      const tourBtn = document.getElementById("start-product-tour-btn");
      if (tourBtn) {
        tourBtn.click();
      } else {
        window.dispatchEvent(new CustomEvent("start-product-tour"));
      }
    }
  };

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#0c4a6e] via-[#0284c7] to-[#0d9488] text-white shadow-xl rounded-2xl">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Profile Avatar with online status */}
          <div className="relative shrink-0">
            <Avatar className="size-20 ring-4 ring-white/20 ring-offset-2 ring-offset-transparent shadow-md">
              <AvatarImage src={avatarUrl ?? undefined} alt={name} className="object-cover" />
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold backdrop-blur-sm">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <span
              className="absolute bottom-0 right-0 size-4 rounded-full bg-emerald-500 ring-2 ring-white"
              title="Online"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            {/* Header Tag */}
            <p className="text-xs font-semibold tracking-wider uppercase text-cyan-200/90">
              STAR E-OFFICE
            </p>

            {/* Main Greeting */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              {greeting}, {name}
            </h1>

            {/* Subtitle */}
            <p className="text-sm font-medium text-white/90">
              Selamat Datang di e-Office Organisasi
            </p>

            {/* Accent divider lines */}
            <div className="flex items-center gap-1.5 py-1">
              <span className="h-1 w-10 rounded-full bg-white/50" />
              <span className="h-1 w-4 rounded-full bg-white/25" />
            </div>

            {/* Slogan Quote */}
            <p className="text-xs sm:text-sm italic font-serif text-cyan-100/90 drop-shadow-sm">
              "{slogan}"
            </p>

            {/* Action buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Button
                onClick={handleOpenDashboard}
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 font-medium px-4 py-2 h-10 rounded-xl transition-all shadow-sm group cursor-pointer"
              >
                <LayoutGrid className="size-4 mr-2 text-cyan-200" />
                Buka Dashboard
                <ArrowRight className="size-4 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>

              <Button
                variant="ghost"
                onClick={handleStartTour}
                className="text-white hover:bg-white/10 hover:text-white font-medium px-4 py-2 h-10 rounded-xl cursor-pointer"
              >
                <Send className="size-4 mr-2" />
                Mulai Tour
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

