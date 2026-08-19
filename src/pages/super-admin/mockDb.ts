export interface Organization {
  _id: string;
  name: string;
  code: string;
  plan: string;
  isActive: boolean;
  usersCount: number;
  documentsCount: number;
  storageUsedMb: number;
  createdAt: string;
  subscriptionPaidUntil: string;
  email: string;
  phone: string;
  address: string;
}

export interface Plan {
  _id: string;
  name: string;
  price: number;
  usersLimit: number;
  features: string[];
  subscribersCount: number;
}

export interface Promo {
  _id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  active: boolean;
  usageCount: number;
  expiryDate: string;
}

export interface Invoice {
  _id: string;
  orgName: string;
  plan: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending";
  billingPeriod: string;
}

export interface UpgradeRequest {
  _id: string;
  orgName: string;
  currentPlan: string;
  requestedPlan: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reason: string;
}

export interface BankAccount {
  _id: string;
  bank: string;
  accountNo: string;
  accountName: string;
  branch: string;
}

export interface AuditLog {
  _id: string;
  timestamp: string;
  user: string;
  action: string;
  organization: string;
  category: string;
  ip: string;
  device: string;
}

export interface LandingFooter {
  landingVisibility: {
    hero: boolean;
    stats: boolean;
    features: boolean;
    benefits: boolean;
    modules: boolean;
    workflow: boolean;
    pricing: boolean;
    testimonials: boolean;
    cta: boolean;
    footer: boolean;
  };
  footerText: string;
  contactEmail: string;
  contactPhone: string;
}

export interface SuperAdminDb {
  organizations: Organization[];
  plans: Plan[];
  promos: Promo[];
  invoices: Invoice[];
  upgradeRequests: UpgradeRequest[];
  bankAccounts: BankAccount[];
  auditLogs: AuditLog[];
  landingFooter: LandingFooter;
}

export function getInitialSuperAdminDb(): SuperAdminDb {
  return {
    organizations: [
      {
        _id: "org1",
        name: "PT Antarmuka Nusantara Technology",
        code: "ANTWI",
        plan: "Enterprise",
        isActive: true,
        usersCount: 128,
        documentsCount: 4520,
        storageUsedMb: 1240,
        createdAt: "2025-01-10",
        subscriptionPaidUntil: "2026-12-31",
        email: "info@antwi.id",
        phone: "021-5544-3321",
        address: "Gedung Cyber 2 Lt. 15, Jl. H.R. Rasuna Said, Jakarta Selatan"
      },
      {
        _id: "org2",
        name: "CV Bima Cahya Wibawa",
        code: "BCW",
        plan: "Poc",
        isActive: true,
        usersCount: 18,
        documentsCount: 680,
        storageUsedMb: 240,
        createdAt: "2025-03-15",
        subscriptionPaidUntil: "2026-09-15",
        email: "contact@bima.wibawa.co.id",
        phone: "022-7788-9900",
        address: "Jl. Soekarno Hatta No. 42, Bandung, Jawa Barat"
      },
      {
        _id: "org3",
        name: "PT Pratama Global Logistics",
        code: "PGL",
        plan: "Enterprise",
        isActive: true,
        usersCount: 215,
        documentsCount: 12400,
        storageUsedMb: 3850,
        createdAt: "2024-11-01",
        subscriptionPaidUntil: "2027-01-01",
        email: "admin@pratamaglobal.co.id",
        phone: "031-8899-7766",
        address: "Kawasan Industri Rungkut Industri III No. 8, Surabaya"
      },
      {
        _id: "org4",
        name: "Star e-Office Internal Workspace",
        code: "STARE",
        plan: "Enterprise",
        isActive: true,
        usersCount: 45,
        documentsCount: 8900,
        storageUsedMb: 2100,
        createdAt: "2024-08-01",
        subscriptionPaidUntil: "2028-12-31",
        email: "internal@stareoffice.id",
        phone: "021-8062-8888",
        address: "Central Park Office Tower Lt. 28, Jakarta Barat"
      },
      {
        _id: "org5",
        name: "PT Media Network Nusantara",
        code: "MNN",
        plan: "Free",
        isActive: true,
        usersCount: 8,
        documentsCount: 120,
        storageUsedMb: 45,
        createdAt: "2025-06-01",
        subscriptionPaidUntil: "2026-12-31",
        email: "hello@medianet.net.id",
        phone: "021-3344-5566",
        address: "Jl. Kebon Sirih No. 17, Jakarta Pusat"
      },
      {
        _id: "org6",
        name: "PT Graha Karya Mandiri",
        code: "GKM",
        plan: "Poc",
        isActive: true,
        usersCount: 32,
        documentsCount: 1150,
        storageUsedMb: 410,
        createdAt: "2025-04-10",
        subscriptionPaidUntil: "2026-10-10",
        email: "office@gkm.id",
        phone: "024-8877-6655",
        address: "Jl. Pandanaran No. 88, Semarang, Jawa Tengah"
      },
      {
        _id: "org7",
        name: "PT Integra Solusi Gemilang",
        code: "ISG",
        plan: "Enterprise",
        isActive: true,
        usersCount: 95,
        documentsCount: 3800,
        storageUsedMb: 1120,
        createdAt: "2025-02-20",
        subscriptionPaidUntil: "2027-02-20",
        email: "support@integra.co.id",
        phone: "021-7766-5544",
        address: "TB Simatupang Park Lt. 5, Jakarta Selatan"
      },
      {
        _id: "org8",
        name: "Koperasi Maju Bersama",
        code: "KMB",
        plan: "Free",
        isActive: false,
        usersCount: 5,
        documentsCount: 40,
        storageUsedMb: 12,
        createdAt: "2024-09-01",
        subscriptionPaidUntil: "2025-09-01",
        email: "koperasi@majubersama.org",
        phone: "0274-5544-33",
        address: "Jl. Malioboro No. 12, Yogyakarta"
      }
    ],
    plans: [
      {
        _id: "plan_free",
        name: "Free",
        price: 0,
        usersLimit: 10,
        features: [
          "Maksimal 10 Karyawan",
          "Arsip Surat Masuk & Keluar",
          "Sertifikat TTE Dasar",
          "Penyimpanan 500 MB",
          "Dukungan Email Community"
        ],
        subscribersCount: 2
      },
      {
        _id: "plan_poc",
        name: "Poc",
        price: 1500000,
        usersLimit: 50,
        features: [
          "Maksimal 50 Karyawan",
          "Semua Fitur Surat & Presensi GPS",
          "Tanda Tangan Elektronik BSrE Ready",
          "Laporan Analytics & Dashboard",
          "Penyimpanan 10 GB",
          "Dukungan Technical Support Chat"
        ],
        subscribersCount: 2
      },
      {
        _id: "plan_enterprise",
        name: "Enterprise",
        price: 5000000,
        usersLimit: 9999,
        features: [
          "Unlimited Karyawan",
          "Custom Subdomain & White-label Branding",
          "Integrasi SIMPEG / Payroll",
          "Modul Agenda & Ruang Rapat VIM",
          "Penyimpanan Unlimited Cloud",
          "Dedicated Account Manager 24/7"
        ],
        subscribersCount: 4
      }
    ],
    promos: [
      {
        _id: "p1",
        code: "STAR2026",
        discount: 20,
        type: "percentage",
        active: true,
        usageCount: 14,
        expiryDate: "2026-12-31"
      },
      {
        _id: "p2",
        code: "DISCOUNT500K",
        discount: 500000,
        type: "fixed",
        active: true,
        usageCount: 6,
        expiryDate: "2026-09-30"
      },
      {
        _id: "p3",
        code: "BUMNPROMO",
        discount: 15,
        type: "percentage",
        active: false,
        usageCount: 22,
        expiryDate: "2025-12-31"
      }
    ],
    invoices: [
      {
        _id: "inv_101",
        orgName: "PT Antarmuka Nusantara Technology",
        plan: "Enterprise",
        amount: 5000000,
        date: "2026-01-10",
        status: "Paid",
        billingPeriod: "1 Tahun Lisensi (2026)"
      },
      {
        _id: "inv_102",
        orgName: "PT Pratama Global Logistics",
        plan: "Enterprise",
        amount: 5000000,
        date: "2026-01-01",
        status: "Paid",
        billingPeriod: "1 Tahun Lisensi (2026)"
      },
      {
        _id: "inv_103",
        orgName: "CV Bima Cahya Wibawa",
        plan: "Poc",
        amount: 1500000,
        date: "2025-09-15",
        status: "Paid",
        billingPeriod: "1 Tahun Lisensi (2025-2026)"
      },
      {
        _id: "inv_104",
        orgName: "PT Graha Karya Mandiri",
        plan: "Poc",
        amount: 1500000,
        date: "2025-10-10",
        status: "Paid",
        billingPeriod: "1 Tahun Lisensi (2025-2026)"
      }
    ],
    upgradeRequests: [
      {
        _id: "req_1",
        orgName: "CV Bima Cahya Wibawa",
        currentPlan: "Poc",
        requestedPlan: "Enterprise",
        status: "pending",
        requestedAt: "2026-08-01T10:30:00Z",
        reason: "Penambahan 150 karyawan baru di divisi ekspedisi regional."
      },
      {
        _id: "req_2",
        orgName: "PT Media Network Nusantara",
        currentPlan: "Free",
        requestedPlan: "Poc",
        status: "pending",
        requestedAt: "2026-08-08T14:15:00Z",
        reason: "Membutuhkan integrasi TTE digital dan modul presensi GPS."
      }
    ],
    bankAccounts: [
      {
        _id: "bank_1",
        bank: "Bank Central Asia (BCA)",
        accountNo: "8830-1234-56",
        accountName: "PT Star Nusantara Digital",
        branch: "KCP Sudirman Jakarta"
      },
      {
        _id: "bank_2",
        bank: "Bank Mandiri",
        accountNo: "122-00-9988776-5",
        accountName: "PT Star Nusantara Digital",
        branch: "KCP Plaza Indonesia"
      }
    ],
    auditLogs: [
      {
        _id: "log_1",
        timestamp: "2026-08-11T09:15:00Z",
        user: "CIP 2017 (parno86@gmail.com)",
        action: "Login Super Admin Console",
        organization: "Platform-wide",
        category: "Akses",
        ip: "182.23.10.99",
        device: "Chrome 127 (Windows 11)"
      },
      {
        _id: "log_2",
        timestamp: "2026-08-10T16:45:00Z",
        user: "CIP 2017 (parno86@gmail.com)",
        action: "Updated Organization Plan: CV Bima Cahya Wibawa",
        organization: "CV Bima Cahya Wibawa",
        category: "Organisasi",
        ip: "182.23.10.99",
        device: "Chrome 127 (Windows 11)"
      },
      {
        _id: "log_3",
        timestamp: "2026-08-09T11:20:00Z",
        user: "Siti Aminah, S.Kom.",
        action: "Generated E-Signature Certificate",
        organization: "PT Antarmuka Nusantara Technology",
        category: "Keamanan",
        ip: "36.85.12.110",
        device: "Firefox 128 (Windows 10)"
      }
    ],
    landingFooter: {
      landingVisibility: {
        hero: true,
        stats: true,
        features: true,
        benefits: true,
        modules: true,
        workflow: true,
        pricing: true,
        testimonials: true,
        cta: true,
        footer: true
      },
      footerText: "Star e-Office adalah solusi tata kelola persuratan digital, e-Agenda, presensi GPS, dan Tanda Tangan Elektronik (TTE) berstandar nasional untuk efisiensi birokrasi perusahaan Anda.",
      contactEmail: "support@stareoffice.id",
      contactPhone: "+62 21 8062 8888"
    }
  };
}
