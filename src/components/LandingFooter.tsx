import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Link } from "react-router-dom";

const DEFAULT_GROUPS = [
  {
    title: "Produk",
    links: ["Star e-Office", "Arsip Digital", "Tanda Tangan Digital", "Dashboard Eksekutif", "Workflow Engine"],
  },
  {
    title: "Perusahaan",
    links: ["Tentang Kami", "Karir", "Blog", "Media Kit", "Hubungi Kami"],
  },
  {
    title: "Dukungan",
    links: ["Pusat Bantuan", "Dokumentasi API", "Status Sistem", "SLA", "Keamanan"],
  },
  {
    title: "Legal",
    links: ["Syarat & Ketentuan", "Kebijakan Privasi", "SLA Enterprise", "GDPR Compliance"],
  },
];

export default function LandingFooter() {
  const allLinks = useQuery(api.footerLinks.getAllFooterLinks, {});

  // Group links dynamically if available
  const groupedLinks = (() => {
    if (!allLinks || !Array.isArray(allLinks) || allLinks.length === 0) {
      return DEFAULT_GROUPS;
    }

    const activeLinks = allLinks.filter((l: any) => l.isActive !== false);
    const groupsMap = new Map<string, string[]>();

    activeLinks.forEach((l: any) => {
      const g = l.group || "Lainnya";
      if (!groupsMap.has(g)) {
        groupsMap.set(g, []);
      }
      groupsMap.get(g)!.push(l.label);
    });

    if (groupsMap.size === 0) return DEFAULT_GROUPS;

    return Array.from(groupsMap.entries()).map(([title, links]) => ({
      title,
      links,
    }));
  })();

  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl text-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-sm">
                S
              </div>
              Star e-Office
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Platform tata kelola surat, administrasi, dan alur kerja perkantoran modern terpadu untuk efisiensi instansi dan korporasi.
            </p>
          </div>

          {/* Dynamic Link Groups */}
          {groupedLinks.map((group) => (
            <div key={group.title} className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                {group.title}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Star e-Office. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/data-privacy" className="hover:text-foreground transition-colors">
              Privasi & Keamanan
            </Link>
            <a href="#" className="hover:text-foreground transition-colors">
              Ketentuan Layanan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
