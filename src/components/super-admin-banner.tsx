/**
 * SuperAdminBanner — banner informatif yang muncul saat super admin
 * mengakses halaman yang biasanya terbatas untuk role/dept tertentu.
 *
 * Memberikan visibilitas jelas bahwa ini adalah mode evaluasi/testing,
 * bukan akses normal, sehingga tidak ada kekeliruan saat review data.
 */
import { ShieldCheck, Eye } from "lucide-react";

type Props = {
  /** Nama halaman / fitur yang sedang diakses */
  pageName?: string;
  /** Role normal yang biasanya diperlukan untuk halaman ini */
  requiredRole?: string;
};

export default function SuperAdminBanner({ pageName, requiredRole }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 px-4 py-3 text-sm mb-4">
      <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
          <Eye className="size-3.5" />
          Super Admin — Mode Evaluasi
        </p>
        <p className="text-amber-700 dark:text-amber-300 mt-0.5 text-xs leading-relaxed">
          Anda mengakses{pageName ? ` <strong>${pageName}</strong>` : " halaman ini"} sebagai <strong>Super Admin</strong>
          {requiredRole ? ` (biasanya hanya untuk: ${requiredRole})` : ""}.
          Data yang ditampilkan adalah data organisasi ini saja — tidak ada akses ke data tenant lain.
        </p>
      </div>
    </div>
  );
}
