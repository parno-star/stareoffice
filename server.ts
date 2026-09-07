import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { db } from "./src/db/index.ts";
import {
  organizations,
  users,
  announcements,
  leaveRequests,
  attendances,
  projects,
  tasks,
  departments,
  letters,
  policies,
  fundRequests,
  events,
  payrollPeriods,
  payslips,
  strategicIssues,
} from "./src/db/schema.ts";
import { eq, desc, sql } from "drizzle-orm";

process.on("unhandledRejection", (reason) => {
  console.warn("[Server Process unhandledRejection]:", reason);
});

process.on("uncaughtException", (error) => {
  console.warn("[Server Process uncaughtException]:", error);
});

const DIRECTORY_DUMMIES = [
  { name: "Bambang Sutrisno", jobTitle: "Direktur Utama", department: "Manajemen", role: "manager", location: "Jakarta Pusat", startDate: "2018-03-01", dateOfBirth: "1975-06-12" },
  { name: "Andi Wijaya", jobTitle: "Manajer SDM", department: "Sumber Daya Manusia", role: "hr_manager", location: "Jakarta Pusat", startDate: "2019-05-15", dateOfBirth: "1983-09-21" },
  { name: "Sri Wahyuni", jobTitle: "Manajer Keuangan", department: "Keuangan", role: "manager", location: "Jakarta Pusat", startDate: "2019-07-01", dateOfBirth: "1982-02-14" },
  { name: "Hendra Gunawan", jobTitle: "Manajer Operasional", department: "Operasional", role: "manager", location: "Surabaya", startDate: "2019-09-10", dateOfBirth: "1980-11-30" },
  { name: "Maya Sari", jobTitle: "Manajer Teknologi Informasi", department: "Teknologi Informasi", role: "manager", location: "Jakarta Selatan", startDate: "2020-01-20", dateOfBirth: "1986-04-05" },
  { name: "Agus Salim", jobTitle: "Manajer Pemasaran", department: "Pemasaran", role: "manager", location: "Bandung", startDate: "2020-02-17", dateOfBirth: "1984-08-19" },
  { name: "Dewi Anggraini", jobTitle: "Staf Rekrutmen", department: "Sumber Daya Manusia", role: "employee", location: "Jakarta Pusat", startDate: "2021-06-01", dateOfBirth: "1993-03-25" },
  { name: "Rizky Pratama", jobTitle: "Staf Personalia", department: "Sumber Daya Manusia", role: "employee", location: "Jakarta Pusat", startDate: "2021-08-12", dateOfBirth: "1994-12-02" },
  { name: "Putri Handayani", jobTitle: "Staf Akuntansi", department: "Keuangan", role: "employee", location: "Jakarta Pusat", startDate: "2021-03-08", dateOfBirth: "1992-07-17" },
  { name: "Fajar Nugroho", jobTitle: "Staf Perpajakan", department: "Keuangan", role: "employee", location: "Jakarta Pusat", startDate: "2022-01-10", dateOfBirth: "1995-01-28" },
  { name: "Wahyu Setiawan", jobTitle: "Supervisor Logistik", department: "Operasional", role: "employee", location: "Surabaya", startDate: "2020-11-02", dateOfBirth: "1988-05-09" },
  { name: "Ratna Dewi", jobTitle: "Staf Pengadaan", department: "Operasional", role: "employee", location: "Surabaya", startDate: "2022-04-18", dateOfBirth: "1996-10-11" },
  { name: "Dimas Prakoso", jobTitle: "Software Engineer", department: "Teknologi Informasi", role: "employee", location: "Jakarta Selatan", startDate: "2021-09-06", dateOfBirth: "1994-02-23" },
  { name: "Indah Permata", jobTitle: "Staf Dukungan TI", department: "Teknologi Informasi", role: "employee", location: "Jakarta Selatan", startDate: "2022-07-25", dateOfBirth: "1997-06-30" },
  { name: "Yoga Aditya", jobTitle: "Staf Pemasaran Digital", department: "Pemasaran", role: "employee", location: "Bandung", startDate: "2022-02-14", dateOfBirth: "1995-09-15" },
  { name: "Lestari Ningsih", jobTitle: "Staf Konten Kreatif", department: "Pemasaran", role: "employee", location: "Bandung", startDate: "2023-01-09", dateOfBirth: "1998-11-20" },
  { name: "Bayu Firmansyah", jobTitle: "Staf Umum", department: "Umum", role: "employee", location: "Jakarta Pusat", startDate: "2022-10-03", dateOfBirth: "1996-04-08" },
  { name: "Citra Kirana", jobTitle: "Resepsionis", department: "Umum", role: "employee", location: "Jakarta Pusat", startDate: "2023-03-20", dateOfBirth: "1999-08-13" },
  { name: "Eko Purnomo", jobTitle: "Pengemudi Operasional", department: "Umum", role: "employee", location: "Surabaya", startDate: "2021-12-01", dateOfBirth: "1990-01-05" },
  { name: "Nadia Safitri", jobTitle: "Administrasi Kantor", department: "Umum", role: "employee", location: "Jakarta Pusat", startDate: "2023-05-15", dateOfBirth: "1998-03-27" },
];

function generateEmail(name: string): string {
  const slug = name.toLowerCase().normalize("NFD").replace(/[^a-z\s]/g, "").trim().replace(/\s+/g, ".");
  return `${slug}@contoh.example.com`;
}

// Track viewing organization for super admin (defaults to null for platform-wide view "Semua Organisasi")
let currentViewingOrgId: number | null = null;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function todayUtc(): Date {
  return startOfUtcDay(new Date());
}

function formatIsoUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextBirthdayOccurrence(
  rawDate: string,
  today: Date,
): { date: Date; daysUntil: number } | null {
  let month = 0;
  let day = 0;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(rawDate);
  if (isoMatch) {
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else {
    const match = /^(\d{2})-(\d{2})/.exec(rawDate);
    if (!match) return null;
    month = Number(match[1]);
    day = Number(match[2]);
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const year = today.getUTCFullYear();
  let candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCMonth() !== month - 1) {
    candidate = new Date(Date.UTC(year, month - 1, day - 1));
  }
  if (candidate.getTime() < today.getTime()) {
    candidate = new Date(Date.UTC(year + 1, month - 1, day));
    if (candidate.getUTCMonth() !== month - 1) {
      candidate = new Date(Date.UTC(year + 1, month - 1, day - 1));
    }
  }
  const daysUntil = Math.round(
    (candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  return { date: candidate, daysUntil };
}

function nextAnniversaryOccurrence(
  isoStart: string,
  today: Date,
): { date: Date; daysUntil: number; years: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoStart);
  if (!match) return null;
  const startYear = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const currentYear = today.getUTCFullYear();
  let year = currentYear;
  let candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCMonth() !== month - 1) {
    candidate = new Date(Date.UTC(year, month - 1, day - 1));
  }
  if (candidate.getTime() < today.getTime()) {
    year = currentYear + 1;
    candidate = new Date(Date.UTC(year, month - 1, day));
    if (candidate.getUTCMonth() !== month - 1) {
      candidate = new Date(Date.UTC(year, month - 1, day - 1));
    }
  }
  const years = year - startYear;
  if (years < 1) return null;

  const daysUntil = Math.round(
    (candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  return { date: candidate, daysUntil, years };
}

async function seedInitialData() {
  try {
    const existingOrg = await db.select().from(organizations).limit(1);
    let orgId = existingOrg[0]?.id;

    if (!existingOrg || existingOrg.length === 0) {
      const insertedOrg = await db.insert(organizations).values({
        slug: "pt-contoh-uji-coba",
        name: "PT Contoh Uji Coba",
        logoUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=128&auto=format&fit=crop&q=80",
        plan: "enterprise",
        isActive: true,
        address: "Jl. Demonstrasi No. 1, Jakarta",
        phone: "021-0000000",
        email: "kontak@contoh.example.com",
        website: "https://contoh.example.com",
        inviteCode: "CONTOH2026",
        isSampleOrg: true,
        approvalStatus: "approved",
      }).returning();
      orgId = insertedOrg[0].id;
    }

    // 1. Users
    let adminUser = await db.select().from(users).where(eq(users.role, "super_admin")).limit(1);
    let adminId = adminUser[0]?.id;
    if (!adminUser || adminUser.length === 0) {
      const inserted = await db.insert(users).values({
        uid: "local-dev-user",
        tokenIdentifier: "local-dev-user",
        name: "Developer Admin",
        nip: "198609052010121001",
        email: "admin@local.test",
        department: "Manajemen",
        jobTitle: "Super Administrator",
        phone: "0812-0000-0000",
        location: "Jakarta Pusat",
        bio: "Penanggung Jawab Sistem dan Operasional Ekosistem Digital Start App.",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&auto=format&fit=crop&q=80",
        role: "super_admin",
        accountStatus: "active",
        organizationId: orgId,
      }).returning();
      adminId = inserted[0].id;
    }

    const currentUsers = await db.select().from(users);
    if (currentUsers.length <= 2) {
      for (const [idx, emp] of DIRECTORY_DUMMIES.entries()) {
        await db.insert(users).values({
          uid: `emp-seed-${idx + 1}`,
          tokenIdentifier: `emp-seed-${idx + 1}`,
          name: emp.name,
          nip: `19${80 + (idx % 15)}${String((idx % 12) + 1).padStart(2, "0")}152014031${String(idx + 1).padStart(3, "0")}`,
          email: generateEmail(emp.name),
          department: emp.department,
          jobTitle: emp.jobTitle,
          role: emp.role,
          location: emp.location,
          startDate: emp.startDate,
          dateOfBirth: emp.dateOfBirth,
          accountStatus: "active",
          organizationId: orgId,
        });
      }
    }

    const allUsers = await db.select().from(users);
    const hrManager = allUsers.find(u => u.role === "hr_manager") || allUsers[0];
    const financeStaff = allUsers.find(u => u.department === "Keuangan") || allUsers[0];
    const employeeUser = allUsers.find(u => u.role === "employee") || allUsers[0];

    // 2. Departments
    const existingDepts = await db.select().from(departments).limit(1);
    if (existingDepts.length === 0) {
      const deptList = [
        { name: "Sumber Daya Manusia", color: "blue", icon: "👥", headId: hrManager.id, order: 1 },
        { name: "Keuangan", color: "emerald", icon: "💰", headId: financeStaff.id, order: 2 },
        { name: "Operasional", color: "violet", icon: "⚙️", headId: adminId, order: 3 },
        { name: "Teknologi Informasi", color: "indigo", icon: "💻", headId: adminId, order: 4 },
        { name: "Pemasaran", color: "orange", icon: "📢", headId: adminId, order: 5 },
        { name: "Umum", color: "slate", icon: "🏢", headId: adminId, order: 6 },
        { name: "Manajemen", color: "amber", icon: "👔", headId: adminId, order: 0 },
      ];
      for (const dept of deptList) {
        await db.insert(departments).values({
          organizationId: orgId,
          name: dept.name,
          color: dept.color,
          icon: dept.icon,
          headId: dept.headId,
          order: dept.order,
        });
      }
    }

    // 3. Letters
    const existingLetters = await db.select().from(letters).limit(1);
    if (existingLetters.length === 0) {
      await db.insert(letters).values([
        {
          organizationId: orgId,
          authorId: hrManager.id,
          type: "keluar",
          status: "sent",
          subject: "Undangan Rapat Koordinasi Bulanan",
          letterNumber: "001/UJI/1",
          letterDate: "2026-01-10",
          place: "Jakarta",
          classification: "biasa",
          fromName: "PT Contoh Uji Coba",
          toName: "Seluruh Karyawan",
          content: "Dengan hormat, kami mengundang Bapak/Ibu untuk menghadiri rapat koordinasi bulanan yang akan diselenggarakan pekan depan.",
          category: "undangan",
          attachmentCount: 0,
          dispositionCount: 0,
          searchText: "undangan rapat koordinasi bulanan 001/uji/1",
        },
        {
          organizationId: orgId,
          authorId: hrManager.id,
          type: "masuk",
          status: "draft",
          subject: "Permohonan Kerja Sama Vendor",
          letterNumber: "001/UJI/2",
          letterDate: "2026-01-10",
          place: "Jakarta",
          classification: "biasa",
          fromName: "PT Vendor Mitra Sejahtera",
          toName: "PT Contoh Uji Coba",
          content: "Bersama surat ini kami mengajukan permohonan kerja sama sebagai penyedia layanan untuk periode tahun berjalan.",
          category: "permohonan",
          attachmentCount: 1,
          dispositionCount: 1,
          searchText: "permohonan kerja sama vendor 001/uji/2",
        },
        {
          organizationId: orgId,
          authorId: hrManager.id,
          type: "keluar",
          status: "draft",
          subject: "Pemberitahuan Libur Nasional",
          letterNumber: "001/UJI/3",
          letterDate: "2026-01-10",
          place: "Jakarta",
          classification: "biasa",
          fromName: "PT Contoh Uji Coba",
          toName: "Seluruh Karyawan",
          content: "Diberitahukan kepada seluruh karyawan bahwa kantor akan diliburkan sehubungan dengan hari libur nasional.",
          category: "pengumuman",
          attachmentCount: 0,
          dispositionCount: 0,
          searchText: "pemberitahuan libur nasional 001/uji/3",
        },
      ]);
    }

    // 4. Leave Requests
    const existingLeaves = await db.select().from(leaveRequests).limit(1);
    if (existingLeaves.length === 0) {
      await db.insert(leaveRequests).values([
        {
          organizationId: orgId,
          userId: employeeUser.id,
          leaveType: "cuti_tahunan",
          startDate: "2026-02-10",
          endDate: "2026-02-12",
          daysCount: 3,
          reason: "Liburan keluarga.",
          status: "pending",
        },
        {
          organizationId: orgId,
          userId: allUsers[7]?.id || employeeUser.id,
          leaveType: "cuti_sakit",
          startDate: "2026-01-20",
          endDate: "2026-01-21",
          daysCount: 2,
          reason: "Sakit dan perlu istirahat.",
          status: "approved",
          approverId: hrManager.id,
          approverNote: "Disetujui, lekas sembuh.",
        },
      ]);
    }

    // 5. Policies
    const existingPolicies = await db.select().from(policies).limit(1);
    if (existingPolicies.length === 0) {
      await db.insert(policies).values([
        {
          organizationId: orgId,
          authorId: hrManager.id,
          title: "Kebijakan Jam Kerja",
          summary: "Aturan jam kerja dan keterlambatan karyawan.",
          content: "Jam kerja kantor adalah 08.00–17.00 dari Senin hingga Jumat. Keterlambatan lebih dari 15 menit akan dicatat.",
          category: "hr",
          version: "1.0",
          status: "published",
          effectiveDate: "2026-01-01",
        },
        {
          organizationId: orgId,
          authorId: adminId,
          title: "Kebijakan Keamanan Data",
          summary: "Panduan menjaga kerahasiaan data perusahaan.",
          content: "Seluruh karyawan wajib menjaga kerahasiaan data perusahaan dan tidak membagikannya ke pihak yang tidak berwenang.",
          category: "it",
          version: "1.0",
          status: "published",
          effectiveDate: "2026-01-01",
        },
      ]);
    }

    // 6. Fund Requests
    const existingFundRequests = await db.select().from(fundRequests).limit(1);
    if (existingFundRequests.length === 0) {
      await db.insert(fundRequests).values([
        {
          organizationId: orgId,
          submitterId: financeStaff.id,
          userDepartment: "Keuangan",
          title: "Pembelian ATK Kantor",
          purpose: "Pengadaan alat tulis kantor untuk kebutuhan operasional triwulan pertama.",
          category: "procurement",
          amount: 2500000,
          neededBy: "2026-02-15",
          status: "pending",
          currentApprovalLevel: 1,
          totalApprovalLevels: 2,
        },
        {
          organizationId: orgId,
          submitterId: financeStaff.id,
          userDepartment: "Keuangan",
          title: "Reimbursement Perjalanan Dinas",
          purpose: "Penggantian biaya perjalanan dinas ke kantor cabang Surabaya.",
          category: "travel",
          amount: 3750000,
          neededBy: "2026-02-01",
          status: "approved",
          currentApprovalLevel: 2,
          totalApprovalLevels: 2,
        },
      ]);
    }

    // 7. Events
    const existingEvents = await db.select().from(events).limit(1);
    if (existingEvents.length === 0) {
      await db.insert(events).values([
        {
          organizationId: orgId,
          authorId: hrManager.id,
          title: "Rapat Koordinasi Bulanan",
          description: "Evaluasi kinerja tim dan rencana kerja bulan berikutnya.",
          category: "meeting",
          startDate: "2026-02-05",
          endDate: "2026-02-05",
          startTime: "09:00",
          endTime: "11:00",
          location: "Ruang Rapat Utama",
          allDay: false,
        },
      ]);
    }

    // 8. Payroll Periods & Payslips
    const existingPayroll = await db.select().from(payrollPeriods).limit(1);
    if (existingPayroll.length === 0) {
      const payroll = await db.insert(payrollPeriods).values({
        organizationId: orgId,
        period: "2026-01",
        periodLabel: "Januari 2026",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        payDate: "2026-01-28",
        status: "published",
        totalGross: 85000000,
        totalDeductions: 4250000,
        totalNet: 80750000,
        employeeCount: allUsers.length,
      }).returning();

      for (const emp of allUsers.slice(0, 5)) {
        const basic = 7500000;
        const earnings = 8500000;
        const deductions = 425000;
        const net = earnings - deductions;
        await db.insert(payslips).values({
          periodId: payroll[0].id,
          organizationId: orgId,
          userId: emp.id,
          period: "2026-01",
          basicSalary: basic,
          totalEarnings: earnings,
          totalDeductions: deductions,
          grossSalary: earnings,
          netSalary: net,
          status: "published",
          userName: emp.name,
          userJobTitle: emp.jobTitle,
          userDepartment: emp.department,
        });
      }
    }

    // 9. Strategic Issues (Papan Isu Strategis)
    try {
      const existingStrategicIssues = await db.select().from(strategicIssues).limit(1);
      if (existingStrategicIssues.length === 0) {
        await db.insert(strategicIssues).values([
          {
            organizationId: orgId,
            title: "Persetujuan Alokasi Investasi Infrastruktur Cloud & AI Q3",
            description: "Usulan migrasi server dan implementasi modul automasi proses bisnis untuk efisiensi operasional tahun berjalan.",
            ownerId: adminId,
            department: "Teknologi Informasi",
            urgency: "high",
            impact: "high",
            dueDate: "2026-09-30T17:00:00.000Z",
            status: "needs_decision",
            authorId: adminId,
          },
          {
            organizationId: orgId,
            title: "Mitigasi Kenaikan Biaya Logistik & Pengadaan Bahan Baku",
            description: "Kenaikan biaya rantai pasok sebesar 14% menuntut penyesuaian strategi kontrak supplier dan negosiasi vendor utama.",
            ownerId: hrManager.id,
            department: "Operasional",
            urgency: "critical",
            impact: "high",
            dueDate: "2026-09-15T17:00:00.000Z",
            status: "in_progress",
            authorId: adminId,
          },
          {
            organizationId: orgId,
            title: "Program Retensi Talenta Kunci & Akselerasi Rekrutmen Spesialis",
            description: "Pemantauan program retensi 15 talenta kunci serta pengisian posisi strategis arsitek sistem dan manajer produk.",
            ownerId: hrManager.id,
            department: "Sumber Daya Manusia",
            urgency: "medium",
            impact: "medium",
            dueDate: "2026-10-15T17:00:00.000Z",
            status: "monitoring",
            authorId: adminId,
          },
          {
            organizationId: orgId,
            title: "Audit Kepatuhan Perlindungan Data Pribadi (UU PDP)",
            description: "Penyelarasan SOP tata kelola privasi data pelanggan dan karyawan telah diselesaikan bersama tim legal.",
            ownerId: adminId,
            department: "Umum",
            urgency: "high",
            impact: "high",
            dueDate: "2026-08-31T17:00:00.000Z",
            status: "resolved",
            resolvedAt: new Date("2026-08-30T10:00:00.000Z"),
            authorId: adminId,
          },
        ]);
      }
    } catch (siErr) {
      console.error("Strategic issues seeding error:", siErr);
    }
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

const DEFAULT_MEMBERSHIP_PLANS = [
  {
    _id: "plan-free",
    id: 1,
    slug: "free",
    name: "Gratis",
    description: "Mulai kelola tim kecil Anda tanpa biaya",
    price: "Rp 0",
    priceUnit: "selamanya",
    pricePerUserMonth: 0,
    maxEmployees: 10,
    maxStorageMb: 500,
    supportLevel: "community",
    coreFeatures: [
      "Direktori Karyawan",
      "Absensi & Cuti dasar",
      "Pengumuman (baca)",
      "Pesan & Notifikasi",
      "Perayaan otomatis",
      "Dokumen Saya",
    ],
    disabledFeatures: [
      "Asisten AI",
      "OKR & Kinerja",
      "Rekrutmen",
      "Pelatihan",
      "Penggajian",
    ],
    order: 1,
    isPopular: false,
    isActive: true,
  },
  {
    _id: "plan-starter",
    id: 2,
    slug: "starter",
    name: "Starter",
    description: "Operasional HR lengkap untuk tim berkembang",
    price: "Rp 25rb",
    priceUnit: "/user/bulan",
    pricePerUserMonth: 25000,
    maxEmployees: 50,
    maxStorageMb: 5120,
    supportLevel: "email",
    coreFeatures: [
      "Semua fitur Gratis",
      "Tugas & Proyek (10 aktif)",
      "Kelola Surat & Kalender",
      "Apresiasi & Polling",
      "Dokumen & Kebijakan",
      "Pemesanan Ruangan",
      "Onboarding karyawan",
      "Penggajian (Payroll)",
    ],
    disabledFeatures: [
      "OKR & Goals",
      "Rekrutmen & ATS",
      "Pelatihan (LMS)",
      "Asisten AI",
    ],
    order: 2,
    isPopular: false,
    isActive: true,
  },
  {
    _id: "plan-professional",
    id: 3,
    slug: "professional",
    name: "Professional",
    description: "Solusi lengkap pengembangan SDM perusahaan",
    price: "Rp 65rb",
    priceUnit: "/user/bulan",
    pricePerUserMonth: 65000,
    maxEmployees: 200,
    maxStorageMb: 51200,
    supportLevel: "priority",
    coreFeatures: [
      "Semua fitur Starter",
      "Asisten AI (Chatbot HR)",
      "Reimbursement & Travel",
      "Tugas & Proyek",
      "Proyek Unlimited",
      "Jenjang Karier",
      "Forum, Saran, Penghargaan",
      "OKR & Penilaian Kinerja",
      "Pulse Survey & Helpdesk",
      "Wiki & Knowledge Base",
      "Inventaris & Aset",
      "Rekrutmen & ATS",
      "Pelatihan (LMS)",
    ],
    disabledFeatures: [
      "Feedback 360°",
      "Talent Management",
      "Analitik Advanced",
    ],
    order: 3,
    isPopular: true,
    isActive: true,
  },
  {
    _id: "plan-enterprise",
    id: 4,
    slug: "enterprise",
    name: "Enterprise",
    description: "Kontrol penuh untuk korporasi besar",
    price: "Custom",
    priceUnit: "hubungi kami",
    pricePerUserMonth: -1,
    maxEmployees: 0,
    maxStorageMb: 0,
    supportLevel: "dedicated",
    coreFeatures: [
      "Semua fitur Professional",
      "Asisten AI Premium",
      "Feedback 360°",
      "Talent Management",
      "Analitik Advanced & Custom",
      "Admin Dashboard lanjutan",
      "Audit Trail & RBAC granular",
      "API Access & Webhook",
      "Dedicated Account Manager",
    ],
    disabledFeatures: [],
    order: 4,
    isPopular: false,
    isActive: true,
  },
];

let membershipPlansState = [...DEFAULT_MEMBERSHIP_PLANS];
const userQuickAccessMap = new Map<string, string[]>();

function formatAttendanceRecord(at: Record<string, unknown>) {
  const checkInTime = at.checkInTime ? String(at.checkInTime) : "";
  const checkOutTime = at.checkOutTime ? String(at.checkOutTime) : "";
  const date = String(at.date || "");

  let clockInAt = checkInTime;
  if (clockInAt && !clockInAt.includes("T")) {
    clockInAt = `${date}T${clockInAt}:00.000Z`;
  }
  let clockOutAt = checkOutTime || null;
  if (clockOutAt && !clockOutAt.includes("T")) {
    clockOutAt = `${date}T${clockOutAt}:00.000Z`;
  }

  let workMinutes: number | undefined = undefined;
  if (clockInAt && clockOutAt) {
    const diff = new Date(clockOutAt).getTime() - new Date(clockInAt).getTime();
    if (diff > 0) {
      workMinutes = Math.round(diff / 60000);
    }
  }

  const isLate = at.status === "terlambat";

  return {
    _id: String(at.id),
    id: Number(at.id),
    userId: String(at.userId),
    organizationId: at.organizationId ? String(at.organizationId) : "1",
    date,
    clockInAt: clockInAt || (at.createdAt ? new Date(String(at.createdAt)).toISOString() : new Date().toISOString()),
    clockOutAt: clockOutAt || undefined,
    workMinutes,
    clockInNote: at.note ? String(at.note) : undefined,
    clockOutNote: undefined,
    location: at.location ? String(at.location) : undefined,
    isLate,
  };
}

function normalizeLeaveType(type: string): string {
  if (!type) return "annual";
  if (type === "cuti_tahunan") return "annual";
  if (type === "cuti_sakit") return "sick";
  if (type === "izin_khusus" || type === "izin") return "personal";
  if (type === "cuti_melahirkan") return "maternity";
  return type;
}

function computeDaysBetween(start: string, end: string): number {
  if (!start || !end) return 1;
  const s = new Date(`${start}T00:00:00Z`).getTime();
  const e = new Date(`${end}T00:00:00Z`).getTime();
  if (isNaN(s) || isNaN(e) || e < s) return 1;
  return Math.floor((e - s) / (24 * 60 * 60 * 1000)) + 1;
}

function formatLeaveRecord(lr: Record<string, unknown>, userMap: Map<number, Record<string, unknown>> = new Map()) {
  const userId = Number(lr.userId);
  const approverId = lr.approverId ? Number(lr.approverId) : undefined;
  const u = userMap.get(userId);
  const rev = approverId ? userMap.get(approverId) : null;
  const rawType = String(lr.leaveType || lr.type || "annual");
  const type = normalizeLeaveType(rawType);
  const dayCount = Number(lr.daysCount || lr.dayCount || 1);

  return {
    _id: String(lr.id),
    id: Number(lr.id),
    userId: String(lr.userId),
    organizationId: lr.organizationId ? String(lr.organizationId) : "1",
    type,
    leaveType: rawType,
    startDate: String(lr.startDate),
    endDate: String(lr.endDate),
    dayCount,
    daysCount: dayCount,
    reason: String(lr.reason || ""),
    status: String(lr.status || "pending"),
    reviewerId: approverId ? String(approverId) : undefined,
    reviewedAt: lr.approvedAt ? new Date(String(lr.approvedAt)).toISOString() : undefined,
    reviewNote: lr.approverNote ? String(lr.approverNote) : undefined,
    _creationTime: lr.createdAt && !isNaN(new Date(String(lr.createdAt)).getTime())
      ? new Date(String(lr.createdAt)).getTime()
      : Date.now(),
    createdAt: lr.createdAt && !isNaN(new Date(String(lr.createdAt)).getTime())
      ? new Date(String(lr.createdAt)).toISOString()
      : new Date().toISOString(),
    userName: u ? String(u.name || "Karyawan") : "Karyawan",
    userDepartment: u ? String(u.department || "") : "",
    userJobTitle: u ? String(u.jobTitle || "") : "",
    userAvatarUrl: u?.avatarUrl ? String(u.avatarUrl) : null,
    reviewerName: rev ? String(rev.name || "") : null,
  };
}

// PostgreSQL Query & Mutation Dispatchers
async function handlePostgresQuery(name: string, args: Record<string, unknown> = {}) {
  const cleanName = (name || "").replace(/^api\./, "");

  if (cleanName === "users:getMyQuickAccess") {
    const adminUsers = await db.select().from(users).where(eq(users.role, "super_admin")).limit(1);
    const user = adminUsers[0] || (await db.select().from(users).limit(1))[0] || null;
    const userId = user ? String(user.id) : "default";
    const saved = userQuickAccessMap.get(userId);
    if (saved) return saved;
    return [
      "/surat-masuk",
      "/surat-keluar",
      "/attendance",
      "/leave-requests",
      "/fund-requests",
      "/policies",
      "/payroll",
      "/directory",
    ];
  }

  if (cleanName === "users:getCurrentUser" || cleanName === "users:current") {
    try {
      const adminUsers = await db.select().from(users).where(eq(users.role, "super_admin")).limit(1);
      const user = adminUsers[0] || (await db.select().from(users).limit(1))[0] || null;
      if (user) {
        return { ...user, _id: String(user.id), id: user.id };
      }
    } catch (err) {
      console.warn("[Postgres Query] users:getCurrentUser fallback to default super_admin:", err);
    }
    // Reliable fallback for Cloud Run / offline DB
    return {
      id: 1,
      _id: "1",
      uid: "local-dev-user",
      tokenIdentifier: "local-dev-user",
      name: "Administrator Utama",
      nip: "198609052010121001",
      email: "parno86@gmail.com",
      department: "Teknologi Informasi & Operasional",
      jobTitle: "Super Administrator / VP Technology",
      phone: "+62 812-3456-7890",
      location: "Kantor Pusat Madiun",
      bio: "Penanggung Jawab Sistem dan Operasional Ekosistem Digital Start App.",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&auto=format&fit=crop&q=80",
      role: "super_admin",
      accountStatus: "active",
      organizationId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Strategic Issues Queries
  if (cleanName === "strategicIssues:listIssues") {
    try {
      const allIssues = await db.select().from(strategicIssues).orderBy(desc(strategicIssues.createdAt));
      const allUsers = await db.select().from(users);
      const userMap = new Map(allUsers.map((u) => [u.id, u]));

      const nowIso = new Date().toISOString();

      const mappedIssues = allIssues.map((r) => {
        const owner = r.ownerId ? userMap.get(r.ownerId) : null;
        return {
          _id: String(r.id),
          title: r.title,
          description: r.description ?? null,
          ownerId: String(r.ownerId || 1),
          ownerName: owner?.name ?? "Tanpa PIC",
          department: r.department ?? owner?.department ?? null,
          urgency: r.urgency ?? "medium",
          impact: r.impact ?? "medium",
          dueDate: r.dueDate ?? null,
          status: r.status ?? "needs_decision",
          linkedObjectiveId: r.linkedObjectiveId ? String(r.linkedObjectiveId) : null,
          linkedObjectiveTitle: null,
          createdAt: r.createdAt ? r.createdAt.toISOString() : nowIso,
          updatedAt: r.updatedAt ? r.updatedAt.toISOString() : nowIso,
          resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
        };
      });

      const STATUS_ORDER: Record<string, number> = {
        needs_decision: 0,
        in_progress: 1,
        monitoring: 2,
        resolved: 3,
      };
      const URGENCY_ORDER: Record<string, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };

      mappedIssues.sort((a, b) => {
        const sa = STATUS_ORDER[a.status] ?? 9;
        const sb = STATUS_ORDER[b.status] ?? 9;
        if (sa !== sb) return sa - sb;
        const ua = URGENCY_ORDER[a.urgency] ?? 9;
        const ub = URGENCY_ORDER[b.urgency] ?? 9;
        if (ua !== ub) return ua - ub;
        const da = a.dueDate ?? "9999";
        const db = b.dueDate ?? "9999";
        return da.localeCompare(db);
      });

      const counts = {
        needsDecision: mappedIssues.filter((r) => r.status === "needs_decision").length,
        inProgress: mappedIssues.filter((r) => r.status === "in_progress").length,
        monitoring: mappedIssues.filter((r) => r.status === "monitoring").length,
        resolved: mappedIssues.filter((r) => r.status === "resolved").length,
        overdue: mappedIssues.filter(
          (r) => r.status !== "resolved" && !!r.dueDate && r.dueDate < nowIso
        ).length,
      };

      return {
        hasAccess: true,
        canManage: true,
        issues: mappedIssues,
        counts,
      };
    } catch (e) {
      console.error("strategicIssues:listIssues error:", e);
      return {
        hasAccess: true,
        canManage: true,
        issues: [],
        counts: { needsDecision: 0, inProgress: 0, monitoring: 0, resolved: 0, overdue: 0 },
      };
    }
  }

  if (cleanName === "strategicIssues:getFormOptions") {
    try {
      const allUsers = await db.select().from(users);
      const allDepts = await db.select().from(departments);

      const owners = allUsers.map((u) => ({
        _id: String(u.id),
        name: u.name ?? "Tanpa nama",
        department: u.department ?? null,
      })).sort((a, b) => a.name.localeCompare(b.name));

      const departmentNames = Array.from(
        new Set([
          ...allDepts.map((d) => d.name),
          ...allUsers.map((u) => u.department).filter(Boolean) as string[],
        ])
      ).sort((a, b) => a.localeCompare(b));

      return {
        owners,
        departments: departmentNames,
        objectives: [],
      };
    } catch (e) {
      console.error("strategicIssues:getFormOptions error:", e);
      return { owners: [], departments: [], objectives: [] };
    }
  }

  if (cleanName === "userSettings:getAllRoleMenus" || cleanName === "userSettings:getConfigurableMenuKeys") {
    return [];
  }

  if (cleanName === "userSettings:getMyAllowedMenus") {
    return [
      "home", "dashboard", "my_profile", "directory", "leave", "attendance", "projects", "messages",
      "calendar", "documents", "my_documents", "wiki", "expenses", "fund_requests", "finance_dashboard",
      "finance_audit", "finance_settings", "finance_laporan", "travel", "onboarding", "training",
      "mentorship", "news", "forum", "suggestions", "support", "gallery", "celebrations", "recognitions",
      "awards", "polls", "rooms", "calls", "organization", "teams", "assets", "jobs", "performance",
      "grading", "talent", "notifications", "reports", "analytics", "bod_dashboard", "strategic_issues",
      "policies", "payroll", "recruitment", "okr", "engagement", "feedback360", "pulse", "offboarding",
      "events", "career_path", "career_planning", "chatbot", "admin", "user_management", "letters",
      "document_archive", "data_privacy", "billing", "profile_verification", "membership_dashboard"
    ];
  }

  if (cleanName === "users:listEmployees" || cleanName === "users:list" || cleanName === "users:listAll") {
    const list = await db.select().from(users);
    return list.map(u => ({ ...u, _id: String(u.id) }));
  }

  if (cleanName === "users:getEmployeeById" || cleanName === "users:getById") {
    const id = Number(args.id || args.userId);
    if (!isNaN(id)) {
      const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (found[0]) return { ...found[0], _id: String(found[0].id) };
    }
    return null;
  }

  if (cleanName === "directory:getEmployeeDetail") {
    const id = Number(args.userId || args.id);
    const allUsers = await db.select().from(users);
    const mappedUsers = allUsers.map(u => ({ ...u, _id: String(u.id) }));
    let targetUser: (typeof mappedUsers)[number] | null = null;

    if (!isNaN(id) && id > 0) {
      targetUser = mappedUsers.find(u => u.id === id) || null;
    }
    if (!targetUser) {
      targetUser = mappedUsers.find(u => u.role === "super_admin") || mappedUsers[0] || null;
    }

    if (!targetUser) {
      return null;
    }

    const manager = targetUser.managerId ? (mappedUsers.find(u => u.id === targetUser.managerId) || null) : null;
    const directReports = mappedUsers.filter(u => u.managerId === targetUser.id);
    const colleagues = mappedUsers.filter(
      u => u.id !== targetUser.id && (targetUser.managerId ? u.managerId === targetUser.managerId : u.department === targetUser.department)
    );

    return {
      user: targetUser,
      manager,
      directReports,
      colleagues,
      skills: [],
      departmentHead: null,
      departmentColor: null,
    };
  }

  if (cleanName === "directory:listAdvanced") {
    const allUsers = await db.select().from(users);
    const mappedUsers = allUsers.map(u => ({ ...u, _id: String(u.id) }));
    const search = String(args.search || "").toLowerCase().trim();
    const department = args.department ? String(args.department) : "all";
    const location = args.location ? String(args.location) : "all";
    const jobTitle = args.jobTitle ? String(args.jobTitle) : "all";

    const filtered = mappedUsers.filter(u => {
      if (search) {
        const matchesName = (u.name || "").toLowerCase().includes(search);
        const matchesTitle = (u.jobTitle || "").toLowerCase().includes(search);
        const matchesEmail = (u.email || "").toLowerCase().includes(search);
        if (!matchesName && !matchesTitle && !matchesEmail) return false;
      }
      if (department !== "all" && (u.department || "") !== department) return false;
      if (location !== "all" && (u.location || "") !== location) return false;
      if (jobTitle !== "all" && (u.jobTitle || "") !== jobTitle) return false;
      return true;
    });

    return filtered.map(u => {
      const manager = u.managerId ? mappedUsers.find(m => m.id === u.managerId) : null;
      const reports = mappedUsers.filter(r => r.managerId === u.id);
      return {
        user: u,
        skills: [],
        directReportCount: reports.length,
        managerName: manager?.name || null,
        departmentName: u.department || null,
      };
    });
  }

  if (cleanName === "directory:listFilterOptions") {
    const allUsers = await db.select().from(users);
    const deptsMap = new Map<string, number>();
    const locsMap = new Map<string, number>();
    const titlesMap = new Map<string, number>();

    let withManager = 0;
    let withoutManager = 0;

    for (const u of allUsers) {
      if (u.department) deptsMap.set(u.department, (deptsMap.get(u.department) || 0) + 1);
      if (u.location) locsMap.set(u.location, (locsMap.get(u.location) || 0) + 1);
      if (u.jobTitle) titlesMap.set(u.jobTitle, (titlesMap.get(u.jobTitle) || 0) + 1);
      if (u.managerId) withManager++; else withoutManager++;
    }

    return {
      departments: Array.from(deptsMap.entries()).map(([value, count]) => ({ value, count })),
      locations: Array.from(locsMap.entries()).map(([value, count]) => ({ value, count })),
      jobTitles: Array.from(titlesMap.entries()).map(([value, count]) => ({ value, count })),
      skills: [],
      totalEmployees: allUsers.length,
      withManagerCount: withManager,
      withoutManagerCount: withoutManager,
    };
  }

  if (cleanName === "organization:listDepartments") {
    const list = await db.select().from(departments).orderBy(departments.order);
    const allUsers = await db.select().from(users);
    return list.map(d => {
      const head = d.headId ? allUsers.find(u => u.id === d.headId) : null;
      const memberCount = allUsers.filter(u => u.department === d.name).length;
      return {
        department: { ...d, _id: String(d.id) },
        head: head ? { ...head, _id: String(head.id) } : null,
        memberCount,
      };
    });
  }

  if (cleanName === "users:listDepartments") {
    const allUsers = await db.select().from(users);
    const deptList = await db.select().from(departments).orderBy(departments.order);
    const set = new Set<string>();
    deptList.forEach(d => { if (d.name) set.add(d.name); });
    allUsers.forEach(u => { if (u.department) set.add(u.department); });
    return Array.from(set);
  }

  if (cleanName === "departments:list") {
    const list = await db.select().from(departments).orderBy(departments.order);
    return list.map(d => ({ ...d, _id: String(d.id) }));
  }

  if (cleanName === "organization:getCurrent" || cleanName === "organization:get" || cleanName === "organizations:getCurrent" || cleanName === "organizations:getMyOrganization") {
    try {
      const adminUsers = await db.select().from(users).where(eq(users.role, "super_admin")).limit(1);
      const currentUser = adminUsers[0] || (await db.select().from(users).limit(1))[0] || null;

      // Super admins default to viewing the default or active org if specified
      if (currentUser?.role === "super_admin") {
        if (currentViewingOrgId) {
          const orgs = await db.select().from(organizations).where(eq(organizations.id, currentViewingOrgId)).limit(1);
          if (orgs[0]) return { ...orgs[0], _id: String(orgs[0].id) };
        }
        if (currentUser?.organizationId) {
          const orgs = await db.select().from(organizations).where(eq(organizations.id, currentUser.organizationId)).limit(1);
          if (orgs[0]) return { ...orgs[0], _id: String(orgs[0].id) };
        }
      }

      if (currentUser?.organizationId) {
        const orgs = await db.select().from(organizations).where(eq(organizations.id, currentUser.organizationId)).limit(1);
        if (orgs[0]) return { ...orgs[0], _id: String(orgs[0].id) };
      }

      const orgs = await db.select().from(organizations).limit(1);
      if (orgs[0]) return { ...orgs[0], _id: String(orgs[0].id) };
    } catch (err) {
      console.warn("[Postgres Query] getMyOrganization fallback:", err);
    }

    return {
      id: 1,
      _id: "1",
      slug: "pt-inka-persero",
      name: "PT Industri Kereta Api (Persero)",
      logoUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=128&auto=format&fit=crop&q=80",
      plan: "enterprise",
      isActive: true,
      address: "Jl. Yos Sudarso No.71, Madiun, Jawa Timur",
      phone: "+62 351 457701",
      email: "sekretariat@inka.co.id",
      website: "https://www.inka.co.id",
      inviteCode: "INKA2026",
      isSampleOrg: true,
      approvalStatus: "approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (cleanName === "organizations:searchForSwitcher") {
    const term = (typeof args?.search === "string" ? args.search : "").trim().toLowerCase();
    const allOrgs = await db.select().from(organizations);
    const allUsers = await db.select().from(users);
    const counts: Record<string, number> = {};
    for (const u of allUsers) {
      if (u.organizationId) {
        counts[String(u.organizationId)] = (counts[String(u.organizationId)] ?? 0) + 1;
      }
    }
    let list = allOrgs.map((o) => ({
      _id: String(o.id),
      name: o.name,
      isActive: Boolean(o.isActive),
      userCount: counts[String(o.id)] ?? 0,
      isSampleOrg: Boolean(o.isSampleOrg),
    }));
    if (term) {
      list = list.filter((o) => o.name.toLowerCase().includes(term));
    }
    return list.slice(0, 8);
  }

  if (cleanName === "organizations:getSampleOrgForSwitcher") {
    const sampleOrgs = await db.select().from(organizations).where(eq(organizations.isSampleOrg, true)).limit(1);
    const org = sampleOrgs[0] || (await db.select().from(organizations).limit(1))[0] || null;
    if (org) return { _id: String(org.id), name: org.name };
    return null;
  }

  if (cleanName === "organization:listAll") {
    const allUsers = await db.select().from(users);
    return allUsers.filter(u => u.role !== "super_admin").map(u => ({ ...u, _id: String(u.id) }));
  }

  if (cleanName === "organizations:listAll") {
    const list = await db.select().from(organizations);
    return list.map(o => ({ ...o, _id: String(o.id) }));
  }

  if (cleanName === "organization:getOrgStats") {
    const allUsers = await db.select().from(users);
    const regularUsers = allUsers.filter(u => u.role !== "super_admin");
    const allDepts = await db.select().from(departments);

    const userDeptNames = new Set<string>();
    const managerIds = new Set<string>();
    let unassignedCount = 0;
    for (const u of regularUsers) {
      if (u.department && u.department.trim().length > 0) {
        userDeptNames.add(u.department.trim());
      }
      if (u.managerId) {
        managerIds.add(String(u.managerId));
      } else {
        unassignedCount += 1;
      }
    }
    const officialNames = new Set(allDepts.map(d => d.name));
    for (const name of userDeptNames) {
      officialNames.add(name);
    }

    return {
      totalEmployees: regularUsers.length,
      totalDepartments: officialNames.size,
      totalManagers: managerIds.size,
      unassignedCount,
    };
  }

  if (cleanName === "organization:getPositionLevelMap") {
    return {};
  }

  if (cleanName === "organization:getAnalytics") {
    const allUsers = await db.select().from(users);
    const regUsers = allUsers.filter(u => u.role !== "super_admin");
    const managerIds = new Set(regUsers.filter(u => u.managerId).map(u => String(u.managerId)));
    const totalManagers = managerIds.size;
    const icCount = regUsers.length - totalManagers;

    const deptMap = new Map<string, number>();
    for (const u of regUsers) {
      const dept = u.department || "Tanpa Departemen";
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    }
    const departmentSizes = Array.from(deptMap.entries()).map(([department, count]) => ({
      department,
      count,
    }));

    return {
      totalEmployees: regUsers.length,
      totalManagers,
      icCount,
      maxDepth: 3,
      avgSpan: totalManagers > 0 ? Math.round((regUsers.length / totalManagers) * 10) / 10 : 0,
      maxSpan: 5,
      topManagers: [],
      depthDistribution: [
        { depth: 0, count: 1 },
        { depth: 1, count: 3 },
        { depth: 2, count: 6 },
      ],
      departmentSizes,
    };
  }

  if (cleanName === "organization:getReportingLine") {
    return [];
  }

  if (cleanName === "organization:listTeams") {
    return [];
  }

  if (cleanName === "organization:getTeam") {
    return null;
  }

  if (cleanName.startsWith("positionLevels:")) {
    return [];
  }

  if (cleanName.startsWith("grading:") || cleanName.startsWith("grading/")) {
    if (cleanName.includes("getDashboardStats")) {
      return {
        totalPositions: 0,
        activePositions: 0,
        gradedPositions: 0,
        pendingEvaluations: 0,
        approvedEvaluations: 0,
        totalAssignments: 0,
        avgCompaRatio: null,
        gradeDistribution: {},
        byDepartment: [],
      };
    }
    if (cleanName.includes("listSalaryBands") || cleanName.includes("listCompanySizes") || cleanName.includes("myPendingEvaluations") || cleanName.includes("listPositions")) {
      return [];
    }
    if (cleanName.includes("getEvaluation") || cleanName.includes("getPositionDetail")) {
      return null;
    }
    return [];
  }

  if (cleanName.startsWith("orgAdvanced:") || cleanName.startsWith("orgAdvanced/")) {
    if (cleanName.includes("spanOfControl") && cleanName.includes("getSpanStats")) {
      const allUsers = await db.select().from(users);
      const regUsers = allUsers.filter(u => u.role !== "super_admin");
      const userById = new Map<string, Record<string, unknown>>();
      const childrenOf = new Map<string, Array<Record<string, unknown>>>();
      for (const u of regUsers) {
        const uid = String(u.id);
        userById.set(uid, { ...u, _id: uid });
      }
      for (const u of regUsers) {
        if (u.managerId) {
          const mid = String(u.managerId);
          const list = childrenOf.get(mid) ?? [];
          list.push({ ...u, _id: String(u.id) });
          childrenOf.set(mid, list);
        }
      }
      const managerIds = new Set<string>();
      for (const [mid, kids] of childrenOf.entries()) {
        if (kids.length > 0) managerIds.add(mid);
      }
      const rows: Array<Record<string, unknown>> = [];
      let totalSpan = 0;
      let maxSpan = 0;
      let stretched = 0;
      let underused = 0;

      for (const mid of managerIds) {
        const manager = userById.get(mid);
        if (!manager) continue;
        const kids = childrenOf.get(mid) ?? [];
        const direct = kids.length;
        totalSpan += direct;
        if (direct > maxSpan) maxSpan = direct;
        let health = "healthy";
        if (direct > 10) { health = "stretched"; stretched += 1; }
        else if (direct === 1) { health = "underused"; underused += 1; }
        else if (direct < 5) { health = "lonely"; }
        rows.push({
          manager,
          directReports: direct,
          totalReports: direct,
          depth: 1,
          health,
          departments: [],
        });
      }
      rows.sort((a, b) => b.directReports - a.directReports);
      const totalManagers = managerIds.size;
      const totalIcs = Math.max(0, regUsers.length - totalManagers);
      const avgSpan = totalManagers > 0 ? Math.round((totalSpan / totalManagers) * 10) / 10 : 0;
      return {
        totalManagers,
        totalIcs,
        managerRatio: totalManagers > 0 ? Math.round((totalIcs / totalManagers) * 10) / 10 : 0,
        avgSpan,
        maxSpan,
        stretchedCount: stretched,
        underusedCount: underused,
        orphanCount: 0,
        maxDepth: 2,
        rows,
      };
    }
    if (cleanName.includes("skills") && cleanName.includes("getMatrix")) {
      return {
        skills: [],
        topSkilledUsers: [],
      };
    }
    if (cleanName.includes("insights") && cleanName.includes("getOrgInsights")) {
      return {
        generatedAt: new Date().toISOString(),
        healthScore: 100,
        totalInsights: 0,
        criticalCount: 0,
        warningCount: 0,
        positiveCount: 0,
        insights: [],
        categories: [],
      };
    }
    if (cleanName.includes("jobRoles") && cleanName.includes("getKpiSummary")) {
      return {
        totalRoles: 0,
        totalKpis: 0,
        measurementsThisPeriod: 0,
        onTrack: 0,
        atRisk: 0,
        offTrack: 0,
      };
    }
    if (cleanName.includes("headcount") && cleanName.includes("summary")) {
      return {
        totals: { open: 0, planned: 0, filled: 0, cancelled: 0 },
        byDepartment: [],
      };
    }
    if (cleanName.includes("scenarios") && cleanName.includes("getStats")) {
      return {
        draft: 0,
        pending: 0,
        approved: 0,
        applied: 0,
        myPendingApprovals: 0,
      };
    }
    if (cleanName.includes("summary")) {
      return { coveredIncumbents: 0, totalPlans: 0, readyNowCount: 0, criticalRoles: 0, readyNow: 0, totalCandidates: 0 };
    }
    if (cleanName.endsWith(":get") || cleanName.includes(":getRole") || cleanName.includes(":getScenario") || cleanName.includes(":getForUser")) {
      return null;
    }
    return [];
  }

  if (cleanName === "letters:list" || cleanName === "letters:getMyLetters" || cleanName === "letters:listRecent") {
    const list = await db.select().from(letters).orderBy(desc(letters.createdAt));
    return list.map(l => ({ ...l, _id: String(l.id) }));
  }

  if (cleanName === "letters:getMyDispositionUnreadCount") {
    return { count: 0 };
  }

  if (cleanName === "letters:listLetterheads" || cleanName === "letters:listLetterNumberConfigs") {
    return [];
  }

  if (cleanName === "letters:previewNextLetterNumber") {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const letterType = String(args.letterType || "keluar");
    const prefix = args.prefixOverride
      ? String(args.prefixOverride)
      : (letterType === "memo" ? "NOTA" : letterType.toUpperCase());
    return `${prefix}/001/${month}/${year}`;
  }

  if (cleanName === "announcements:list" || cleanName === "announcements:getRecent") {
    const list = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
    return list.map(a => ({ ...a, _id: String(a.id) }));
  }

  if (cleanName === "events:list" || cleanName === "events:listInRange" || cleanName === "events:listUpcoming") {
    const list = await db.select().from(events).orderBy(events.startDate);
    return list.map(e => ({ ...e, _id: String(e.id) }));
  }

  if (cleanName === "events:getStats") {
    const list = await db.select().from(events);
    return { total: list.length, upcoming: list.length, past: 0, thisMonth: list.length };
  }

  if (cleanName === "projects:list" || cleanName === "projects:listActive") {
    const list = await db.select().from(projects).orderBy(desc(projects.createdAt));
    return list.map(p => ({ ...p, _id: String(p.id) }));
  }

  if (cleanName === "tasks:list" || cleanName === "tasks:getByProject") {
    if (args.projectId) {
      const list = await db.select().from(tasks).where(eq(tasks.projectId, Number(args.projectId)));
      return list.map(t => ({ ...t, _id: String(t.id) }));
    }
    const list = await db.select().from(tasks);
    return list.map(t => ({ ...t, _id: String(t.id) }));
  }

  if (cleanName === "leaveRequests:getMyStats") {
    const all = await db.select().from(leaveRequests);
    const year = new Date().getFullYear();
    const myId = 1;
    const myRequests = all.filter(r => Number(r.userId) === myId);

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let approvedDays = 0;
    let annualUsed = 0;

    for (const r of myRequests) {
      const dayCount = Number(r.daysCount || 1);
      const type = normalizeLeaveType(String(r.leaveType));
      const rYear = Number(String(r.startDate).slice(0, 4));

      if (r.status === "pending") {
        pending += 1;
      } else if (r.status === "approved") {
        approved += 1;
        approvedDays += dayCount;
        if (type === "annual" && rYear === year) {
          annualUsed += dayCount;
        }
      } else if (r.status === "rejected") {
        rejected += 1;
      }
    }

    const annualQuota = 12;
    const annualRemaining = Math.max(0, annualQuota - annualUsed);

    return {
      pending,
      approved,
      rejected,
      approvedDays,
      annualQuota,
      annualUsed,
      annualRemaining,
      year,
    };
  }

  if (cleanName === "leaveRequests:getPendingCount" || cleanName === "leaveRequests:getSidebarBadgeCount") {
    const all = await db.select().from(leaveRequests).where(eq(leaveRequests.status, "pending"));
    return all.length;
  }

  if (cleanName === "leaveRequests:listMine") {
    const all = await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u as Record<string, unknown>]));
    const myId = 1;
    return all.filter(r => Number(r.userId) === myId).map(r => formatLeaveRecord(r, userMap));
  }

  if (cleanName === "leaveRequests:listForReview") {
    const status = args.status ? String(args.status) : "pending";
    const all = await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u as Record<string, unknown>]));
    const filtered = all.filter(r => !status || r.status === status);
    return filtered.map(r => formatLeaveRecord(r, userMap));
  }

  if (cleanName === "leaveRequests:listUpcoming") {
    const days = Number(args.days) || 30;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const futureDate = new Date(now.getTime() + days * 86400000).toISOString().slice(0, 10);

    const all = await db.select().from(leaveRequests).where(eq(leaveRequests.status, "approved"));
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u as Record<string, unknown>]));

    const filtered = all.filter(r => r.startDate >= todayStr && r.startDate <= futureDate);
    return filtered.map(r => formatLeaveRecord(r, userMap));
  }

  if (cleanName === "leaveRequests:listOnLeaveToday") {
    const todayStr = new Date().toISOString().slice(0, 10);
    const all = await db.select().from(leaveRequests).where(eq(leaveRequests.status, "approved"));
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u as Record<string, unknown>]));

    const filtered = all.filter(r => r.startDate <= todayStr && r.endDate >= todayStr);
    return filtered.map(r => formatLeaveRecord(r, userMap));
  }

  if (cleanName === "leaveRequests:listBalances") {
    const year = Number(args.year) || new Date().getFullYear();
    const allUsers = await db.select().from(users);
    const allLeaves = await db.select().from(leaveRequests).where(eq(leaveRequests.status, "approved"));

    return allUsers.map(u => {
      const userLeaves = allLeaves.filter(l => Number(l.userId) === u.id);
      let annualUsed = 0;
      for (const l of userLeaves) {
        const type = normalizeLeaveType(String(l.leaveType));
        const rYear = Number(String(l.startDate).slice(0, 4));
        if (type === "annual" && rYear === year) {
          annualUsed += Number(l.daysCount || 1);
        }
      }
      const annualQuota = 12;
      return {
        userId: String(u.id),
        name: u.name || "Karyawan",
        department: u.department || "",
        jobTitle: u.jobTitle || "",
        avatarUrl: u.avatarUrl || null,
        year,
        annualQuota,
        annualUsed,
        annualRemaining: Math.max(0, annualQuota - annualUsed),
      };
    });
  }

  if (cleanName === "leaveRequests:list" || cleanName === "leaves:list" || cleanName === "leaveRequests:getMyLeaves") {
    const list = await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u as Record<string, unknown>]));
    return list.map(lr => formatLeaveRecord(lr, userMap));
  }

  if (cleanName === "attendance:getMyMonthSummary") {
    const all = await db.select().from(attendances);
    const startDate = String(args.startDate || "");
    const endDate = String(args.endDate || "");
    const filtered = all.filter((a) => {
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      return true;
    });

    let totalMinutes = 0;
    let countWithHours = 0;
    let lateDays = 0;
    for (const item of filtered) {
      const rec = formatAttendanceRecord(item);
      if (rec.isLate) lateDays += 1;
      if (rec.workMinutes !== undefined) {
        totalMinutes += rec.workMinutes;
        countWithHours += 1;
      }
    }
    const avgMinutes = countWithHours > 0 ? Math.round(totalMinutes / countWithHours) : 0;
    return {
      presentDays: filtered.length,
      lateDays,
      totalMinutes,
      avgMinutes,
    };
  }

  if (cleanName === "attendance:getTodayRecord") {
    const dateStr = String(args.date || new Date().toISOString().slice(0, 10));
    const all = await db.select().from(attendances).where(eq(attendances.date, dateStr)).limit(1);
    if (!all || all.length === 0) return null;
    return formatAttendanceRecord(all[0]);
  }

  if (cleanName === "attendance:listMyHistory") {
    const all = await db.select().from(attendances).orderBy(desc(attendances.date));
    const startDate = String(args.startDate || "");
    const endDate = String(args.endDate || "");
    const filtered = all.filter((a) => {
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      return true;
    });
    return filtered.map(formatAttendanceRecord);
  }

  if (cleanName === "attendance:listTodayTeam") {
    const dateStr = String(args.date || new Date().toISOString().slice(0, 10));
    const recs = await db.select().from(attendances).where(eq(attendances.date, dateStr));
    const allUsers = await db.select().from(users);
    return recs.map((r) => {
      const u = allUsers.find((user) => user.id === r.userId);
      return {
        record: formatAttendanceRecord(r),
        user: u ? { ...u, _id: String(u.id) } : null,
      };
    });
  }

  if (cleanName === "attendance:list" || cleanName === "attendances:list" || cleanName === "attendance:getToday") {
    const list = await db.select().from(attendances).orderBy(desc(attendances.date));
    return list.map(formatAttendanceRecord);
  }

  if (cleanName === "fundRequests:list") {
    const list = await db.select().from(fundRequests).orderBy(desc(fundRequests.createdAt));
    return list.map(fr => ({ ...fr, _id: String(fr.id) }));
  }

  if (cleanName === "fundRequests:listCategories") {
    return ["Operasional", "Perjalanan Dinas", "Pengadaan Alat", "Pelatihan & Seminar", "Lainnya"];
  }

  if (cleanName === "policies:list") {
    const list = await db.select().from(policies);
    return list.map(p => ({ ...p, _id: String(p.id) }));
  }

  if (cleanName.startsWith("footerLinks:") || cleanName.startsWith("footerLinks/")) {
    return [];
  }

  if (cleanName.startsWith("roleRequests:") || cleanName.startsWith("roleRequests/")) {
    return [];
  }

  if (cleanName.startsWith("roleMenuSettings:") || cleanName.startsWith("roleMenuSettings/")) {
    if (cleanName.includes("getAllRoleMenuSettings")) {
      return {
        super_admin: { allowedMenus: [], isCustomized: false },
        admin: { allowedMenus: [], isCustomized: false },
        finance: { allowedMenus: [], isCustomized: false },
        hr: { allowedMenus: [], isCustomized: false },
        manager: { allowedMenus: [], isCustomized: false },
        employee: { allowedMenus: [], isCustomized: false },
      };
    }
    return [];
  }

  if (cleanName.startsWith("membershipDashboard:") || cleanName.startsWith("membershipDashboard/")) {
    if (cleanName.includes("getOverviewStats")) {
      return {
        totalOrgs: 0,
        activeOrgs: 0,
        totalPlans: 0,
        activePlans: 0,
        totalUsers: 0,
        pendingUpgrades: 0,
        activePromos: 0,
        totalRedemptions: 0,
      };
    }
    return [];
  }

  if (cleanName.startsWith("financeDashboard:") || cleanName.startsWith("financeDashboard/")) {
    if (cleanName.includes("getSummary")) {
      return {
        totalRequests: 0,
        totalAmount: 0,
        pendingCount: 0,
        pendingAmount: 0,
        approvedCount: 0,
        approvedAmount: 0,
        rejectedCount: 0,
        rejectedAmount: 0,
        disbursedCount: 0,
        disbursedAmount: 0,
        revisionCount: 0,
        draftCount: 0,
        awaitingMyApproval: 0,
      };
    }
    if (cleanName.includes("getSidebarBadgeCount")) {
      return 0;
    }
    return [];
  }

  if (cleanName.startsWith("subscriptionBilling:") || cleanName.startsWith("subscriptionBilling/")) {
    if (cleanName.includes("getMySubscription")) {
      return {
        subscription: {
          status: "active",
          statusLabel: "Aktif",
          planName: "Enterprise",
          paidUntil: "2027-01-01",
          daysRemaining: 365,
          isExpired: false,
          isOverdue: false,
          isDueSoon: false,
          cycleMonths: 12,
        },
        orgName: "Perusahaan Utama",
        isTrial: false,
        planId: "plan_1",
        planName: "Enterprise Plan",
        pricePerUserMonth: 50000,
        userCount: 10,
        payments: [],
        pendingPaymentCount: 0,
      };
    }
    return [];
  }

  if (
    cleanName.startsWith("invoices:") ||
    cleanName.startsWith("invoices/") ||
    cleanName.startsWith("paymentSettings:") ||
    cleanName.startsWith("paymentSettings/") ||
    cleanName.startsWith("featureAddons:") ||
    cleanName.startsWith("featureAddons/") ||
    cleanName.startsWith("addonBilling:") ||
    cleanName.startsWith("addonBilling/")
  ) {
    return [];
  }

  if (cleanName.startsWith("seatBilling:") || cleanName.startsWith("seatBilling/")) {
    if (cleanName.includes("getMySeatInfo")) {
      return {
        isActive: true,
        planMaxEmployees: 50,
        effectiveMax: 50,
        usedSeats: 10,
        extraSeats: 0,
        pricePerSeat: 25000,
        planName: "Enterprise",
        purchases: [],
      };
    }
    return [];
  }

  if (cleanName === "courses:getStats") {
    return { enrolledCount: 0, inProgressCount: 0, completedCount: 0 };
  }

  if (cleanName === "careerPath:getStats") {
    return { myAssignments: 0, publishedPaths: 0 };
  }

  if (cleanName.includes("recruitment") && cleanName.includes("getStats")) {
    return {
      canManage: true,
      openCount: 0,
      draftCount: 0,
      totalCandidates: 0,
      activeApplications: 0,
      interviewsThisWeek: 0,
      hiredThisMonth: 0,
    };
  }

  if (cleanName.includes("offboarding") && cleanName.includes("getStats")) {
    return {
      pendingRequests: 0,
      activeCases: 0,
      completedCases: 0,
      avgTenure: null,
      avgSatisfaction: null,
      avgRecommend: null,
      reasonBreakdown: [],
      departmentBreakdown: [],
    };
  }

  if (cleanName.includes("payroll") && cleanName.includes("getDashboard")) {
    return {
      isAdmin: true,
      componentCount: 0,
      activePeriods: 0,
      draftPeriods: 0,
      latestPeriod: null,
      employeeWithoutSalary: 0,
      myLatestNet: 0,
      myLatestPeriod: null,
      myNextPayDate: null,
      myAcknowledgmentNeeded: 0,
      myLifetimeEarnings: 0,
    };
  }

  if (cleanName === "payroll:listPeriods" || cleanName === "payrollPeriods:list") {
    const list = await db.select().from(payrollPeriods);
    return list.map(p => ({ ...p, _id: String(p.id) }));
  }

  if (cleanName === "payroll:listPayslips" || cleanName === "payslips:list") {
    const list = await db.select().from(payslips);
    return list.map(p => ({ ...p, _id: String(p.id) }));
  }

  if (cleanName.startsWith("dashboardStats:") || cleanName === "stats:getDashboardStats") {
    if (cleanName === "dashboardStats:getEOfficeStats") {
      const [allMasuk, allKeluar, allDrafts, allUsers] = await Promise.all([
        db.select().from(letters).where(eq(letters.type, "masuk")),
        db.select().from(letters).where(eq(letters.type, "keluar")),
        db.select().from(letters).where(eq(letters.status, "draft")),
        db.select().from(users),
      ]);
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

      const allLetters = await db.select().from(letters);
      const suratBulanIni = allLetters.filter(l => l.letterDate?.startsWith(currentMonthStr) || l.createdAt?.toISOString().startsWith(currentMonthStr)).length;
      const suratBulanLalu = allLetters.filter(l => l.letterDate?.startsWith(lastMonthStr) || l.createdAt?.toISOString().startsWith(lastMonthStr)).length;

      return {
        suratMasuk: allMasuk.length,
        suratKeluar: allKeluar.length,
        disposisiPending: 0,
        approvalPending: 0,
        totalKaryawan: allUsers.length,
        suratDraft: allDrafts.length,
        suratBulanIni: suratBulanIni || allLetters.length,
        suratBulanLalu: suratBulanLalu,
      };
    }

    if (cleanName === "dashboardStats:getRecentLetters") {
      const recent = await db.select().from(letters).limit(8);
      const allUsers = await db.select().from(users);
      return recent.map(l => {
        const author = allUsers.find(u => u.id === l.authorId);
        return {
          _id: String(l.id),
          subject: l.subject,
          type: l.type,
          status: l.status,
          letterNumber: l.letterNumber,
          fromName: l.fromName,
          toName: l.toName,
          letterDate: l.letterDate,
          category: l.category,
          _creationTime: l.createdAt ? new Date(l.createdAt).getTime() : Date.now(),
          authorName: author?.name ?? "Administrator",
        };
      });
    }

    if (cleanName === "dashboardStats:getRecentActivity") {
      return [];
    }

    if (cleanName === "dashboardStats:getMyPendingDispositions") {
      return [];
    }

    const [u, l, p, lr] = await Promise.all([
      db.select().from(users),
      db.select().from(letters),
      db.select().from(projects),
      db.select().from(leaveRequests),
    ]);
    return {
      totalEmployees: u.length,
      totalLetters: l.length,
      totalProjects: p.length,
      pendingLeaves: lr.filter(x => x.status === "pending").length,
    };
  }

  if (cleanName.startsWith("notifications:")) {
    return cleanName.includes("Count") ? { count: 0 } : [];
  }

  if (cleanName.startsWith("directoryFields:")) {
    return [];
  }

  if (cleanName.startsWith("positionDirectory:") || cleanName.startsWith("positionLevels:")) {
    return [];
  }

  if (cleanName.startsWith("membership:")) {
    if (cleanName === "membership:getById") {
      const planId = args?.planId || args?.id;
      return membershipPlansState.find(p => p._id === planId || String(p.id) === String(planId) || p.slug === planId) || membershipPlansState[0];
    }
    if (cleanName === "membership:listActive") {
      return membershipPlansState.filter(p => p.isActive);
    }
    return membershipPlansState;
  }

  if (cleanName.startsWith("subscriptionBilling:")) {
    if (cleanName === "subscriptionBilling:getMySubscription") {
      return {
        subscription: {
          status: "active",
          paidUntil: "2028-01-01T00:00:00.000Z",
          daysUntilDue: 365,
          isReadOnly: false,
          cycleMonths: 12,
        },
        orgName: "PT Industri Kereta Api (Persero)",
        isTrial: false,
        planId: null,
        planName: "Enterprise",
        pricePerUserMonth: 0,
        userCount: 22,
        payments: [],
        pendingPaymentCount: 0,
      };
    }
    return [];
  }

  if (cleanName.startsWith("planAccess:")) {
    if (cleanName === "planAccess:isFeatureBlocked") {
      return {
        blocked: false,
        planName: "Enterprise",
        upgradeMessage: null,
      };
    }
    if (cleanName === "planAccess:getMyOrgPlan") {
      return {
        plan: {
          name: "Enterprise",
          tier: "enterprise",
          maxEmployees: 1000,
          maxStorageMb: 10000,
        },
        blockedMenus: [],
        org: null,
      };
    }
    if (cleanName === "planAccess:getOrgUsage") {
      const allUsers = await db.select().from(users);
      return {
        employeeCount: allUsers.length,
        maxEmployees: 1000,
        isOverEmployeeLimit: false,
        storageMb: 15,
        maxStorageMb: 10000,
        isOverStorageLimit: false,
      };
    }
    return {
      blocked: false,
      plan: null,
      blockedMenus: [],
    };
  }

  if (cleanName.startsWith("dataAccess:")) {
    if (cleanName === "dataAccess:getMyAccessStatus") {
      return {
        pending: null,
        active: {
          _id: "grant-active-1",
          status: "approved",
          scopes: ["all", "employees", "finance", "documents", "attendance", "inventory", "surveys"],
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          requestedAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
        },
      };
    }
    if (cleanName === "dataAccess:getMyEffectiveScopes") {
      return { restricted: false, scopes: [] };
    }
    if (cleanName === "dataAccess:getMyViewingAccessState") {
      return { pendingGrant: false, organizationName: null };
    }
    if (
      cleanName === "dataAccess:listPendingRequests" ||
      cleanName === "dataAccess:listActiveGrants" ||
      cleanName === "dataAccess:listAudit"
    ) {
      return [];
    }
    return null;
  }

  if (cleanName.startsWith("welcomePage:")) {
    if (cleanName === "welcomePage:getContent") {
      return {
        organizationName: "PT Industri Kereta Api (Persero)",
        organizationLogo: null,
        slogan: "Bersama Membangun Masa Depan Digital",
        values: [
          {
            icon: "🎯",
            title: "Integritas",
            description: "Menjunjung tinggi kejujuran dan transparansi dalam setiap keputusan dan tindakan.",
          },
          {
            icon: "🚀",
            title: "Inovasi",
            description: "Terus berinovasi untuk memberikan solusi terbaik dan meningkatkan efisiensi kerja.",
          },
          {
            icon: "🤝",
            title: "Kolaborasi",
            description: "Bekerja sama sebagai tim yang solid untuk mencapai tujuan bersama organisasi.",
          },
          {
            icon: "⭐",
            title: "Keunggulan",
            description: "Berkomitmen untuk memberikan kualitas terbaik dalam setiap layanan dan produk.",
          },
        ],
        bannerSlides: [
          {
            imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
            caption: "Kolaborasi Tim yang Solid & Produktif",
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
            caption: "Transformasi Digital Modern Star e-Office",
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
            caption: "Efisiensi dan Transparansi Administrasi",
          },
        ],
        spotlightText: "#TransformasiDigital #KerjaCerdas #TimHebat",
        carouselSettings: {
          transitionType: "slide",
          duration: 5,
          transitionSpeed: 400,
          autoPlay: true,
        },
        hasCustomContent: true,
      };
    }
    return [];
  }

  if (cleanName.startsWith("superAdmin:")) {
    if (cleanName === "superAdmin:getPlatformStats") {
      const [allOrgs, allUsers] = await Promise.all([
        db.select().from(organizations),
        db.select().from(users),
      ]);

      const activeOrgs = allOrgs.filter(o => o.isActive).length;
      const activeUsers = allUsers.filter(u => !u.accountStatus || u.accountStatus === "active").length;
      const pendingUsers = allUsers.filter(u => u.accountStatus === "pending_approval").length;
      const suspendedUsers = allUsers.filter(u => u.accountStatus === "suspended").length;
      const usersWithoutOrg = allUsers.filter(u => !u.organizationId && u.role !== "super_admin").length;

      // Plan distribution
      const planMap = new Map<string, number>();
      for (const o of allOrgs) {
        const plan = o.plan ?? "enterprise";
        planMap.set(plan, (planMap.get(plan) ?? 0) + 1);
      }

      // Role distribution
      const roleMap = new Map<string, number>();
      for (const u of allUsers) {
        const role = u.role ?? "employee";
        roleMap.set(role, (roleMap.get(role) ?? 0) + 1);
      }

      return {
        totalOrganizations: allOrgs.length,
        activeOrganizations: activeOrgs,
        inactiveOrganizations: allOrgs.length - activeOrgs,
        totalUsers: allUsers.length,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        usersWithoutOrg,
        planDistribution: Array.from(planMap.entries()).map(([plan, count]) => ({ plan, count })),
        roleDistribution: Array.from(roleMap.entries()).map(([role, count]) => ({ role, count })),
        recentOrganizations: allOrgs.slice(0, 5).map(o => ({ ...o, _id: String(o.id) })),
      };
    }

    if (cleanName === "superAdmin:getAccessGovernanceSummary") {
      const allOrgs = await db.select().from(organizations);
      return {
        totalOrganizations: allOrgs.length,
        activeGrants: allOrgs.length,
        pendingRequests: 0,
        coveragePercent: 100,
        activeGrantsList: allOrgs.slice(0, 5).map(o => ({
          organizationId: String(o.id),
          orgName: o.name,
          expiresAt: null,
        })),
      };
    }

    return [];
  }

  if (cleanName === "organizations:getUserCounts") {
    const allUsers = await db.select().from(users);
    const counts: Record<string, number> = {};
    for (const u of allUsers) {
      if (u.organizationId) {
        const key = String(u.organizationId);
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }

  if (cleanName === "organizations:listPendingRegistrations") {
    return [];
  }

  // BoD Extended query support
  if (cleanName === "bodExtended:getRevenueSummary") {
    const period = (args.period as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    return {
      hasAccess: true,
      period,
      totalRevenue: 0,
      totalBudget: 0,
      achievement: 0,
      totalGrossProfit: 0,
      grossProfitProgram: 0,
      grossProfitMargin: 0,
      totalEbitda: 0,
      ebitdaProgram: 0,
      ebitdaMargin: 0,
      totalCashFlow: 0,
      cashFlowProgram: 0,
      totalAr: 0,
      arProgram: 0,
      totalAp: 0,
      apProgram: 0,
      totalCost: 0,
      totalCostProgram: 0,
      totalNetProfit: 0,
      netProfitProgram: 0,
      byDivision: [],
      revenueByLine: [],
    };
  }

  if (cleanName === "bodExtended:getProductionSummary") {
    const period = (args.period as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    return {
      period,
      activeProjects: 0,
      jasaProjects: 0,
      manufakturProjects: 0,
      onTrackProjects: 0,
      atRiskProjects: 0,
      delayedProjects: 0,
      completedProjects: 0,
      otdRate: 100,
      avgCapacityUtilization: 0,
      totalOutputVolume: 0,
      totalPipelineValue: 0,
      byDivision: [],
    };
  }

  if (cleanName === "bodExtended:getHrSummary") {
    const period = (args.period as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    return {
      period,
      totalHeadcount: 0,
      jasaHeadcount: 0,
      manufakturHeadcount: 0,
      attendanceRate: 100,
      productivityScore: 100,
      totalPayroll: 0,
      avgSalary: 0,
      totalAbsent: 0,
      totalOvertime: 0,
      totalTrainingHours: 0,
      turnoverRate: 0,
      byDivision: [],
    };
  }

  if (cleanName === "bodExtended:getRiskSummary") {
    const period = (args.period as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    return {
      period,
      totalRisks: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      openRisks: 0,
      mitigatedRisks: 0,
      byDivision: [],
    };
  }

  if (cleanName === "bodExtended:getAuditSummary") {
    const period = (args.period as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    return {
      period,
      total: 0,
      open: 0,
      inProgress: 0,
      closed: 0,
      overdue: 0,
      critical: 0,
      major: 0,
      minor: 0,
      byDivision: [],
    };
  }

  if (cleanName === "bodExtended:getHseSummary") {
    const period = (args.period as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    return {
      period,
      totalIncidents: 0,
      fatality: 0,
      lostTime: 0,
      totalLostDays: 0,
      nearMiss: 0,
      medicalTreatment: 0,
      firstAid: 0,
      safeHours: 0,
      byDivision: [],
    };
  }

  if (cleanName === "bodExtended:getRevenueTrend" || cleanName === "bodExtended:getHrTrend" || cleanName === "bodExtended:getProductionTrend") {
    return { hasAccess: true, periods: [] };
  }

  if (cleanName === "bodExtended:getAvailablePeriods") {
    const now = new Date();
    const periods: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return periods;
  }

  if (cleanName === "bodExtended:getTabConfig") {
    return {};
  }

  if (cleanName === "bodExtended:getCurrentUserDeptInfo") {
    const adminUsers = await db.select().from(users).where(eq(users.role, "super_admin")).limit(1);
    const user = adminUsers[0] || (await db.select().from(users).limit(1))[0] || null;
    return {
      userName: user?.name || "Admin Keuangan",
      userJobTitle: user?.position || "Kepala Keuangan",
      departmentName: user?.department || "Keuangan",
      departmentCode: "KEU",
      isHeadOfDept: true,
      headName: user?.name || "Admin Keuangan",
      role: user?.role || "super_admin",
    };
  }

  if (cleanName.startsWith("bodExtended:")) {
    return [];
  }

  // BoD Queries
  if (cleanName === "bod:getExecutiveSummary") {
    const allUsers = await db.select().from(users);
    const allDepts = await db.select().from(departments);
    const allFunds = await db.select().from(fundRequests);
    const totalEmployees = allUsers.length;
    const totalDepartments = allDepts.length;

    let pendingCount = 0;
    let pendingAmount = 0;
    let approvedThisMonth = 0;
    for (const f of allFunds) {
      if (f.status === "pending" || f.status === "in_review") {
        pendingCount += 1;
        pendingAmount += Number(f.amount) || 0;
      } else if (f.status === "approved" || f.status === "disbursed") {
        approvedThisMonth += Number(f.amount) || 0;
      }
    }

    return {
      hasAccess: true,
      periodLabel: `Tahun ${new Date().getFullYear()}`,
      generatedAt: new Date().toISOString(),
      kpis: [
        {
          key: "okr_progress",
          label: "Progres OKR Strategis",
          value: "75%",
          sublabel: "4 objektif perusahaan & departemen",
          rag: "green",
          deltaLabel: null,
          deltaDirection: null,
          higherIsBetter: true,
        },
        {
          key: "okr_risk",
          label: "Objektif Berisiko",
          value: "0",
          sublabel: "0% dari objektif strategis",
          rag: "green",
          deltaLabel: null,
          deltaDirection: null,
          higherIsBetter: false,
        },
        {
          key: "headcount",
          label: "Total Karyawan",
          value: totalEmployees.toLocaleString("id-ID"),
          sublabel: `${totalDepartments} departemen aktif`,
          rag: "neutral",
          deltaLabel: "+2 (90 hari)",
          deltaDirection: "up",
          higherIsBetter: true,
        },
        {
          key: "finance_approved",
          label: "Dana Disetujui (Bulan Ini)",
          value: `Rp ${(approvedThisMonth / 1_000_000).toFixed(1)}jt`,
          sublabel: "Bulan lalu Rp 0jt",
          rag: "neutral",
          deltaLabel: null,
          deltaDirection: null,
          higherIsBetter: false,
        },
        {
          key: "finance_pending",
          label: "Pengajuan Dana Menunggu",
          value: String(pendingCount),
          sublabel: `Senilai Rp ${(pendingAmount / 1_000_000).toFixed(1)}jt`,
          rag: pendingCount === 0 ? "green" : pendingCount <= 5 ? "amber" : "red",
          deltaLabel: null,
          deltaDirection: null,
          higherIsBetter: false,
        },
        {
          key: "okr_achieved",
          label: "Objektif Tercapai",
          value: "1",
          sublabel: "dari 4 objektif strategis",
          rag: "neutral",
          deltaLabel: null,
          deltaDirection: null,
          higherIsBetter: true,
        },
      ],
      okrHealth: {
        total: 4,
        onTrack: 3,
        atRisk: 0,
        offTrack: 0,
        achieved: 1,
        averageProgress: 75,
      },
      finance: {
        approvedThisMonth,
        approvedLastMonth: 0,
        pendingCount,
        pendingAmount,
      },
      workforce: { totalEmployees, totalDepartments, newHires90d: 2 },
    };
  }

  if (cleanName === "bod:getUnitKpis") {
    const allDepts = await db.select().from(departments);
    const allUsers = await db.select().from(users);
    const units = allDepts.map((d) => {
      const empCount = allUsers.filter((u) => u.department === d.name).length;
      return {
        departmentId: String(d.id),
        name: d.name,
        color: "#3b82f6",
        headName: "Manajer Unit",
        employeeCount: empCount,
        objectiveCount: 2,
        averageProgress: 75,
        onTrack: 2,
        atRisk: 0,
        offTrack: 0,
        achieved: 0,
        riskCount: 0,
        rag: "green",
      };
    });
    return {
      hasAccess: true,
      periodLabel: `Tahun ${new Date().getFullYear()}`,
      units,
    };
  }

  if (cleanName === "bod:getEscalations") {
    return {
      hasAccess: true,
      generatedAt: new Date().toISOString(),
      criticalCount: 0,
      highCount: 0,
      items: [],
    };
  }

  if (cleanName === "bod:getUnitDetail") {
    const deptId = Number(args.departmentId);
    const dept = (await db.select().from(departments).where(eq(departments.id, deptId)))[0];
    if (!dept) return { found: false };
    const allUsers = await db.select().from(users);
    const empCount = allUsers.filter((u) => u.department === dept.name).length;
    return {
      found: true,
      hasAccess: true,
      department: {
        _id: String(dept.id),
        name: dept.name,
        code: dept.code || "",
        color: "#3b82f6",
      },
      headName: "Manajer Unit",
      employeeCount: empCount,
      kpi: {
        departmentId: String(dept.id),
        name: dept.name,
        color: "#3b82f6",
        headName: "Manajer Unit",
        employeeCount: empCount,
        objectiveCount: 2,
        averageProgress: 75,
        onTrack: 2,
        atRisk: 0,
        offTrack: 0,
        achieved: 0,
        riskCount: 0,
        rag: "green",
      },
      objectives: [],
      periodLabel: `Tahun ${new Date().getFullYear()}`,
    };
  }

  // Celebrations Queries
  if (cleanName === "celebrations:todayCelebrations") {
    const allUsers = await db.select().from(users);
    const today = todayUtc();
    const birthdays: Array<Record<string, unknown>> = [];
    const anniversaries: Array<Record<string, unknown>> = [];

    for (const u of allUsers) {
      const bdayStr = u.birthday || u.dateOfBirth;
      if (bdayStr) {
        const next = nextBirthdayOccurrence(bdayStr, today);
        if (next && next.daysUntil === 0) {
          birthdays.push({
            userId: String(u.id),
            name: u.name ?? "Tanpa Nama",
            jobTitle: u.jobTitle ?? null,
            department: u.department ?? null,
            avatarUrl: u.avatarUrl ?? null,
            birthday: bdayStr,
            daysUntil: 0,
            nextDate: formatIsoUtc(next.date),
          });
        }
      }
      if (u.startDate) {
        const next = nextAnniversaryOccurrence(u.startDate, today);
        if (next && next.daysUntil === 0) {
          anniversaries.push({
            userId: String(u.id),
            name: u.name ?? "Tanpa Nama",
            jobTitle: u.jobTitle ?? null,
            department: u.department ?? null,
            avatarUrl: u.avatarUrl ?? null,
            startDate: u.startDate,
            years: next.years,
            daysUntil: 0,
            nextDate: formatIsoUtc(next.date),
          });
        }
      }
    }
    return { birthdays, anniversaries };
  }

  if (cleanName === "celebrations:listUpcomingBirthdays") {
    const allUsers = await db.select().from(users);
    const today = todayUtc();
    const items: Array<Record<string, unknown>> = [];
    for (const u of allUsers) {
      const bdayStr = u.birthday || u.dateOfBirth;
      if (!bdayStr) continue;
      const next = nextBirthdayOccurrence(bdayStr, today);
      if (!next || next.daysUntil > 60) continue;
      items.push({
        userId: String(u.id),
        name: u.name ?? "Tanpa Nama",
        jobTitle: u.jobTitle ?? null,
        department: u.department ?? null,
        avatarUrl: u.avatarUrl ?? null,
        birthday: bdayStr,
        daysUntil: next.daysUntil,
        nextDate: formatIsoUtc(next.date),
      });
    }
    items.sort((a, b) => ((a.daysUntil as number) - (b.daysUntil as number)));
    return items;
  }

  if (cleanName === "celebrations:listUpcomingAnniversaries") {
    const allUsers = await db.select().from(users);
    const today = todayUtc();
    const items: Array<Record<string, unknown>> = [];
    for (const u of allUsers) {
      if (!u.startDate) continue;
      const next = nextAnniversaryOccurrence(u.startDate, today);
      if (!next || next.daysUntil > 60) continue;
      items.push({
        userId: String(u.id),
        name: u.name ?? "Tanpa Nama",
        jobTitle: u.jobTitle ?? null,
        department: u.department ?? null,
        avatarUrl: u.avatarUrl ?? null,
        startDate: u.startDate,
        years: next.years,
        daysUntil: next.daysUntil,
        nextDate: formatIsoUtc(next.date),
      });
    }
    items.sort((a, b) => ((a.daysUntil as number) - (b.daysUntil as number)));
    return items;
  }

  // Site Settings Query
  if (cleanName === "siteSettings:getLandingSectionVisibility") {
    return landingSectionVisibility;
  }

  // Expenses queries
  if (cleanName === "expenses:getStats") {
    const allFunds = await db.select().from(fundRequests);
    const myId = 1;
    const mine = allFunds.filter((f) => f.submitterId === myId);
    let myPending = 0;
    let myApprovedAmount = 0;
    let myPaidAmount = 0;
    for (const f of mine) {
      if (f.status === "pending") myPending += 1;
      if (f.status === "approved") myApprovedAmount += Number(f.amount || 0);
      if (f.status === "paid") myPaidAmount += Number(f.amount || 0);
    }
    const adminPending = allFunds.filter((f) => f.status === "pending");
    const adminPendingCount = adminPending.length;
    const adminPendingAmount = adminPending.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    return {
      myTotal: mine.length,
      myPending,
      myApprovedAmount,
      myPaidAmount,
      adminPendingCount,
      adminPendingAmount,
    };
  }

  if (cleanName === "cashAdvances:getStats") {
    return {
      myPendingCount: 0,
      myActiveCount: 0,
      myOutstandingAmount: 0,
      adminPendingCount: 0,
      adminOutstandingAmount: 0,
    };
  }

  if (cleanName === "expenses:listMine") {
    const allFunds = await db.select().from(fundRequests);
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const myFunds = allFunds.filter((f) => f.submitterId === 1 || !f.submitterId);
    return myFunds.map((fr) => {
      const u = userMap.get(fr.submitterId || 1);
      const d = fr.createdAt ? new Date(fr.createdAt).toISOString() : new Date().toISOString();
      return {
        _id: String(fr.id),
        id: fr.id,
        userId: String(fr.submitterId || 1),
        title: fr.title || "Pengeluaran",
        category: fr.category || "other",
        amount: Number(fr.amount || 0),
        expenseDate: fr.neededBy || d.slice(0, 10),
        description: fr.purpose || "",
        status: fr.status || "pending",
        userDepartment: fr.userDepartment || u?.department || "Operasional",
        organizationId: fr.organizationId ? String(fr.organizationId) : "1",
        _creationTime: fr.createdAt ? new Date(fr.createdAt).getTime() : Date.now(),
        userName: u?.name || "Karyawan",
        userAvatar: u?.avatarUrl || null,
        reviewerName: null,
        receiptUrl: null,
        cashAdvanceTitle: null,
      };
    });
  }

  if (cleanName === "expenses:listAll") {
    const allFunds = await db.select().from(fundRequests);
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    return allFunds.map((fr) => {
      const u = userMap.get(fr.submitterId || 1);
      const d = fr.createdAt ? new Date(fr.createdAt).toISOString() : new Date().toISOString();
      return {
        _id: String(fr.id),
        id: fr.id,
        userId: String(fr.submitterId || 1),
        title: fr.title || "Pengeluaran",
        category: fr.category || "other",
        amount: Number(fr.amount || 0),
        expenseDate: fr.neededBy || d.slice(0, 10),
        description: fr.purpose || "",
        status: fr.status || "pending",
        userDepartment: fr.userDepartment || u?.department || "Operasional",
        organizationId: fr.organizationId ? String(fr.organizationId) : "1",
        _creationTime: fr.createdAt ? new Date(fr.createdAt).getTime() : Date.now(),
        userName: u?.name || "Karyawan",
        userAvatar: u?.avatarUrl || null,
        reviewerName: null,
        receiptUrl: null,
        cashAdvanceTitle: null,
      };
    });
  }

  if (cleanName === "expenses:listDepartments") {
    const allUsers = await db.select().from(users);
    const depts = new Set<string>();
    for (const u of allUsers) {
      if (u.department) depts.add(u.department);
    }
    return Array.from(depts);
  }

  if (cleanName === "expenseCategories:list") {
    return [
      { _id: "cat_travel", key: "travel", label: "Perjalanan Dinas", icon: "Plane", isActive: true },
      { _id: "cat_meal", key: "meal", label: "Konsumsi & Makan", icon: "Utensils", isActive: true },
      { _id: "cat_supplies", key: "supplies", label: "ATK & Perlengkapan", icon: "Paperclip", isActive: true },
      { _id: "cat_transport", key: "transport", label: "Transportasi Lokal", icon: "Car", isActive: true },
      { _id: "cat_training", key: "training", label: "Pelatihan & Kursus", icon: "GraduationCap", isActive: true },
      { _id: "cat_other", key: "other", label: "Lainnya", icon: "MoreHorizontal", isActive: true },
    ];
  }

  if (cleanName === "expensePolicies:list") {
    return [];
  }

  if (cleanName === "expenses:getAnalytics") {
    return {
      totalSpent: 6250000,
      monthlyBreakdown: [],
      categoryBreakdown: [],
      departmentBreakdown: [],
    };
  }

  if (cleanName === "cashAdvances:listMine" || cleanName === "cashAdvances:listAll" || cleanName === "cashAdvances:listApprovedForMe") {
    return [];
  }

  // Travel queries
  if (cleanName === "travel:getStats") {
    return {
      myDraft: 0,
      myPending: 0,
      myApproved: 0,
      myCompleted: 0,
      myUpcomingCount: 0,
      myTotalTrips: 0,
      myTotalEstimated: 0,
      adminPendingCount: 0,
      adminInProgressCount: 0,
    };
  }

  if (cleanName === "travel:listMine" || cleanName === "travel:listAll" || cleanName === "travel:listForReview") {
    return [];
  }

  if (cleanName === "travel:listDepartments") {
    const allUsers = await db.select().from(users);
    const depts = new Set<string>();
    for (const u of allUsers) {
      if (u.department) depts.add(u.department);
    }
    return Array.from(depts);
  }

  if (cleanName === "travel:getAnalytics") {
    return {
      totalTrips: 0,
      totalBudget: 0,
      byDepartment: [],
      byDestination: [],
    };
  }

  // Performance queries
  if (cleanName === "performance:getStats") {
    return {
      myTotal: 0,
      myAvgRating: null,
      myLatestPeriod: null,
      myLatestRating: null,
      myPendingAck: 0,
      asReviewerDraft: 0,
      asReviewerSubmitted: 0,
      asReviewerTotal: 0,
      canReview: true,
    };
  }

  // Generic fallback for any getStats query so components never crash on null
  if (cleanName.endsWith(":getStats")) {
    return {};
  }

  // Safe fallback
  if (
    cleanName.includes(":get") ||
    cleanName.includes(":find") ||
    cleanName.includes(":is") ||
    cleanName.includes(":preview") ||
    cleanName.endsWith("Detail") ||
    cleanName.endsWith("ById") ||
    cleanName.endsWith("Config")
  ) {
    return null;
  }
  return [];
}

const DEFAULT_LANDING_VISIBILITY: Record<string, boolean> = {
  hero: true,
  stats: true,
  trustedBy: true,
  features: true,
  demo: true,
  benefits: true,
  modules: true,
  workflow: true,
  calls: true,
  security: true,
  testimonial: true,
  pricing: true,
  cta: true,
  footer: true,
};

let landingSectionVisibility = { ...DEFAULT_LANDING_VISIBILITY };

async function handlePostgresMutation(name: string, args: Record<string, unknown> = {}) {
  const cleanName = (name || "").replace(/^api\./, "");

  if (cleanName === "organizations:setViewingOrganization") {
    const orgId = args?.organizationId;
    if (orgId === null || orgId === undefined || orgId === "all" || orgId === "") {
      currentViewingOrgId = null;
    } else {
      currentViewingOrgId = Number(orgId);
    }
    return { success: true };
  }

  if (cleanName.startsWith("dataAccess:")) {
    if (cleanName === "dataAccess:requestAccess") {
      return { success: true, id: "grant-req-1" };
    }
    if (
      cleanName === "dataAccess:approveRequest" ||
      cleanName === "dataAccess:denyRequest" ||
      cleanName === "dataAccess:revokeGrant"
    ) {
      return { success: true };
    }
    if (cleanName === "dataAccess:exportAuditCsv") {
      return "Action,Actor,Timestamp\n";
    }
    return { success: true };
  }

  // Strategic Issues Mutations
  if (cleanName === "strategicIssues:createIssue") {
    const title = String(args.title || "").trim();
    if (!title) throw new Error("Judul isu tidak boleh kosong");

    const ownerParsed = args.ownerId ? parseInt(String(args.ownerId), 10) : null;
    const cleanOwnerId = Number.isInteger(ownerParsed) ? ownerParsed : null;
    const adminUser = await db.select().from(users).where(eq(users.role, "super_admin")).limit(1);
    const authorId = adminUser[0]?.id || 1;
    const orgId = adminUser[0]?.organizationId || 1;

    const linkedObjParsed = args.linkedObjectiveId ? parseInt(String(args.linkedObjectiveId), 10) : null;
    const cleanLinkedObjId = Number.isInteger(linkedObjParsed) ? linkedObjParsed : null;

    const inserted = await db.insert(strategicIssues).values({
      organizationId: orgId,
      title,
      description: args.description ? String(args.description).trim() : null,
      ownerId: cleanOwnerId,
      department: args.department ? String(args.department) : null,
      urgency: String(args.urgency || "medium"),
      impact: String(args.impact || "medium"),
      dueDate: args.dueDate ? String(args.dueDate) : null,
      status: String(args.status || "needs_decision"),
      linkedObjectiveId: cleanLinkedObjId,
      authorId,
      resolvedAt: args.status === "resolved" ? new Date() : null,
    }).returning();

    return String(inserted[0].id);
  }

  if (cleanName === "strategicIssues:updateIssue") {
    const rawId = args.issueId || args.id;
    const issueId = parseInt(String(rawId), 10);
    if (!issueId) throw new Error("ID isu tidak valid");

    const title = String(args.title || "").trim();
    if (!title) throw new Error("Judul isu tidak boleh kosong");

    const ownerParsed = args.ownerId ? parseInt(String(args.ownerId), 10) : null;
    const cleanOwnerId = Number.isInteger(ownerParsed) ? ownerParsed : null;
    const status = String(args.status || "needs_decision");

    const linkedObjParsed = args.linkedObjectiveId ? parseInt(String(args.linkedObjectiveId), 10) : null;
    const cleanLinkedObjId = Number.isInteger(linkedObjParsed) ? linkedObjParsed : null;

    await db.update(strategicIssues).set({
      title,
      description: args.description ? String(args.description).trim() : null,
      ownerId: cleanOwnerId,
      department: args.department ? String(args.department) : null,
      urgency: String(args.urgency || "medium"),
      impact: String(args.impact || "medium"),
      dueDate: args.dueDate ? String(args.dueDate) : null,
      status,
      linkedObjectiveId: cleanLinkedObjId,
      resolvedAt: status === "resolved" ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(strategicIssues.id, issueId));

    return null;
  }

  if (cleanName === "strategicIssues:setStatus") {
    const rawId = args.issueId || args.id;
    const issueId = parseInt(String(rawId), 10);
    if (!issueId) throw new Error("ID isu tidak valid");

    const status = String(args.status);
    await db.update(strategicIssues).set({
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(strategicIssues.id, issueId));

    return null;
  }

  if (cleanName === "strategicIssues:deleteIssue") {
    const rawId = args.issueId || args.id;
    const issueId = parseInt(String(rawId), 10);
    if (!issueId) throw new Error("ID isu tidak valid");

    await db.delete(strategicIssues).where(eq(strategicIssues.id, issueId));
    return null;
  }

  if (cleanName.startsWith("membership:")) {
    if (cleanName === "membership:update") {
      const planId = args.planId || args.id;
      const index = membershipPlansState.findIndex(p => p._id === planId || String(p.id) === String(planId));
      if (index !== -1) {
        membershipPlansState[index] = { ...membershipPlansState[index], ...args };
        return membershipPlansState[index];
      }
      return { success: false, message: "Plan not found" };
    }
    if (cleanName === "membership:create") {
      const newPlan = {
        _id: `plan-${Date.now()}`,
        id: membershipPlansState.length + 1,
        slug: (args.slug as string) || `custom-${Date.now()}`,
        name: (args.name as string) || "Custom Plan",
        description: (args.description as string) || "",
        price: (args.price as string) || "Rp 0",
        priceUnit: (args.priceUnit as string) || "/bulan",
        pricePerUserMonth: Number(args.pricePerUserMonth) || 0,
        maxEmployees: Number(args.maxEmployees) || 0,
        maxStorageMb: Number(args.maxStorageMb) || 0,
        supportLevel: (args.supportLevel as string) || "community",
        coreFeatures: Array.isArray(args.coreFeatures) ? (args.coreFeatures as string[]) : [],
        disabledFeatures: Array.isArray(args.disabledFeatures) ? (args.disabledFeatures as string[]) : [],
        order: Number(args.order) || membershipPlansState.length + 1,
        isPopular: Boolean(args.isPopular),
        isActive: args.isActive !== undefined ? Boolean(args.isActive) : true,
      };
      membershipPlansState.push(newPlan);
      return newPlan;
    }
    if (cleanName === "membership:seedDefaults") {
      membershipPlansState = [...DEFAULT_MEMBERSHIP_PLANS];
      return { success: true };
    }
    return { success: true };
  }

  if (cleanName === "siteSettings:updateLandingSectionVisibility") {
    if (args.sections && typeof args.sections === "object") {
      landingSectionVisibility = {
        ...DEFAULT_LANDING_VISIBILITY,
        ...(args.sections as Record<string, boolean>),
      };
    }
    return { success: true, sections: landingSectionVisibility };
  }

  if (cleanName === "letters:create") {
    const inserted = await db.insert(letters).values({
      letterNumber: (args.letterNumber as string) || `LTR-${Date.now()}`,
      title: (args.title as string) || "Surat Baru",
      category: (args.category as string) || "internal",
      status: (args.status as string) || "draft",
      senderName: (args.senderName as string) || "Administrator",
      recipientName: (args.recipientName as string) || "Internal",
      content: (args.content as string) || "",
    }).returning();
    return inserted[0] ? { ...inserted[0], _id: String(inserted[0].id) } : { success: true };
  }

  if (cleanName === "leaveRequests:create") {
    const rawType = String(args.type || args.leaveType || "annual");
    const startDate = String(args.startDate || new Date().toISOString().slice(0, 10));
    const endDate = String(args.endDate || startDate);
    const reason = String(args.reason || "");
    const daysCount = computeDaysBetween(startDate, endDate);

    const inserted = await db.insert(leaveRequests).values({
      organizationId: 1,
      userId: Number(args.userId) || 1,
      leaveType: rawType,
      startDate,
      endDate,
      daysCount,
      reason,
      status: "pending",
    }).returning();
    return inserted[0] ? String(inserted[0].id) : "1";
  }

  if (cleanName === "leaveRequests:review") {
    const id = Number(args.id);
    const decision = String(args.decision || "approved");
    const note = args.note ? String(args.note) : undefined;
    if (id) {
      await db.update(leaveRequests).set({
        status: decision,
        approverId: 1,
        approverNote: note,
        approvedAt: new Date(),
      }).where(eq(leaveRequests.id, id));
    }
    return { success: true };
  }

  if (cleanName === "leaveRequests:bulkReview") {
    const ids = Array.isArray(args.ids) ? (args.ids as (string | number)[]).map(Number) : [];
    const decision = String(args.decision || "approved");
    const note = args.note ? String(args.note) : undefined;
    for (const id of ids) {
      if (id) {
        await db.update(leaveRequests).set({
          status: decision,
          approverId: 1,
          approverNote: note,
          approvedAt: new Date(),
        }).where(eq(leaveRequests.id, id));
      }
    }
    return { count: ids.length };
  }

  if (cleanName === "leaveRequests:cancel") {
    const id = Number(args.id);
    if (id) {
      await db.update(leaveRequests).set({
        status: "cancelled",
      }).where(eq(leaveRequests.id, id));
    }
    return { success: true };
  }

  if (cleanName === "leaveRequests:setQuota") {
    return { success: true };
  }

  if (cleanName === "attendance:clockIn" || cleanName === "attendance:checkIn") {
    const nowIso = String(args.nowIso || new Date().toISOString());
    const dateStr = nowIso.slice(0, 10);
    const timeStr = nowIso.slice(11, 16);
    const d = new Date(nowIso);
    const isLate = d.getHours() >= 9;

    const inserted = await db.insert(attendances).values({
      organizationId: 1,
      userId: Number(args.userId) || 1,
      date: dateStr,
      checkInTime: timeStr,
      status: isLate ? "terlambat" : "hadir",
      location: args.location ? String(args.location) : "Kantor",
      note: args.note ? String(args.note) : "Clock-in",
    }).returning();
    return inserted[0]?.id ? String(inserted[0].id) : "1";
  }

  if (cleanName === "attendance:clockOut" || cleanName === "attendance:checkOut") {
    const nowIso = String(args.nowIso || new Date().toISOString());
    const dateStr = nowIso.slice(0, 10);
    const timeStr = nowIso.slice(11, 16);

    const existing = await db.select().from(attendances).where(eq(attendances.date, dateStr)).limit(1);
    if (existing.length > 0) {
      await db.update(attendances).set({
        checkOutTime: timeStr,
        note: args.note ? `${existing[0].note || ""}; ${args.note}` : existing[0].note,
      }).where(eq(attendances.id, existing[0].id));
      return String(existing[0].id);
    }
    return "1";
  }

  if (cleanName === "projects:create") {
    const inserted = await db.insert(projects).values({
      name: args.name || "Proyek Baru",
      description: args.description || "",
      status: args.status || "planning",
      progress: Number(args.progress) || 0,
      budget: Number(args.budget) || 0,
      spent: 0,
      leadName: args.leadName || "Project Manager",
    }).returning();
    return inserted[0] ? { ...inserted[0], _id: String(inserted[0].id) } : { success: true };
  }

  if (cleanName === "tasks:create") {
    const inserted = await db.insert(tasks).values({
      projectId: Number(args.projectId) || 1,
      title: args.title || "Tugas Baru",
      status: args.status || "todo",
      priority: args.priority || "medium",
      assignedToName: args.assignedToName || "Tim",
    }).returning();
    return inserted[0] ? { ...inserted[0], _id: String(inserted[0].id) } : { success: true };
  }

  if (cleanName === "announcements:create") {
    const inserted = await db.insert(announcements).values({
      title: args.title || "Pengumuman",
      content: args.content || "",
      category: args.category || "general",
      authorName: args.authorName || "Administrator",
      isPinned: Boolean(args.isPinned),
    }).returning();
    return inserted[0] ? { ...inserted[0], _id: String(inserted[0].id) } : { success: true };
  }

  if (cleanName === "events:create") {
    const inserted = await db.insert(events).values({
      title: args.title || "Agenda Baru",
      description: args.description || "",
      startDate: args.startDate || new Date().toISOString(),
      endDate: args.endDate || new Date().toISOString(),
      location: args.location || "Ruang Rapat",
      eventType: args.eventType || "meeting",
    }).returning();
    return inserted[0] ? { ...inserted[0], _id: String(inserted[0].id) } : { success: true };
  }

  if (cleanName === "fundRequests:create") {
    const inserted = await db.insert(fundRequests).values({
      title: args.title || "Pengajuan Dana",
      amount: Number(args.amount) || 0,
      category: args.category || "Operasional",
      description: args.description || "",
      requesterName: args.requesterName || "Pegawai",
      status: "pending",
    }).returning();
    return inserted[0] ? { ...inserted[0], _id: String(inserted[0].id) } : { success: true };
  }

  if (cleanName === "users:updateProfile" || cleanName === "users:update") {
    const id = Number(args.id || args.userId);
    if (!isNaN(id)) {
      const updateData: Record<string, string | null> = {};
      if (typeof args.name === "string") updateData.name = args.name;
      if (typeof args.phone === "string") updateData.phone = args.phone;
      if (typeof args.bio === "string") updateData.bio = args.bio;
      if (typeof args.location === "string") updateData.location = args.location;
      if (typeof args.avatarUrl === "string") updateData.avatarUrl = args.avatarUrl;
      await db.update(users).set(updateData).where(eq(users.id, id));
    }
    return { success: true };
  }

  if (cleanName === "users:updateMyQuickAccess") {
    const adminUsers = await db.select().from(users).where(eq(users.role, "super_admin")).limit(1);
    const user = adminUsers[0] || (await db.select().from(users).limit(1))[0] || null;
    const userId = user ? String(user.id) : "default";
    const shortcuts = Array.isArray(args.shortcuts) ? (args.shortcuts as string[]) : [];
    userQuickAccessMap.set(userId, shortcuts);
    return { success: true };
  }

  return { success: true };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Cloud Run / Reverse Proxy Configuration
  app.set("trust proxy", 1);

  // Standard middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // CORS and Security Headers for AI Studio Iframe and Preview Environment
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    // Prevent aggressive caching on dynamic API routes
    if (req.path.startsWith("/api")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Run initial database seeding / migration on startup
  try {
    await seedInitialData();
    console.log("Database seeded / migrated successfully");
  } catch (err) {
    console.error("Failed to seed initial data:", err);
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      environment: "AI Studio Cloud Run",
      database: "Cloud SQL PostgreSQL (Drizzle ORM)",
      timestamp: new Date().toISOString(),
    });
  });

  // Current user & organization
  app.get("/api/users/current", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const userEmail = req.query.email as string | undefined;

      let user = null;
      if (userEmail) {
        const found = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
        if (found.length > 0) user = found[0];
      }

      if (!user) {
        const adminUsers = await db.select().from(users).where(eq(users.role, "super_admin")).limit(1);
        user = adminUsers[0] || (await db.select().from(users).limit(1))[0] || null;
      }

      let org = null;
      if (user && user.organizationId) {
        const orgList = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
        org = orgList[0] || null;
      }
      res.json({ user, organization: org });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Organization
  app.get("/api/organization/current", async (req, res) => {
    try {
      const orgList = await db.select().from(organizations).limit(1);
      res.json(orgList[0] || null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Users / Directory list
  app.get("/api/users", async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Departments
  app.get("/api/departments", async (req, res) => {
    try {
      const list = await db.select().from(departments).orderBy(departments.order);
      res.json(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Letters (Surat Masuk & Keluar)
  app.get("/api/letters", async (req, res) => {
    try {
      const list = await db.select().from(letters).orderBy(desc(letters.createdAt));
      res.json(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Announcements
  app.get("/api/announcements", async (req, res) => {
    try {
      const list = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
      res.json(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Attendances
  app.get("/api/attendances", async (req, res) => {
    try {
      const list = await db.select().from(attendances).orderBy(desc(attendances.createdAt));
      res.json(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Leave Requests
  app.get("/api/leaves", async (req, res) => {
    try {
      const list = await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
      res.json(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Projects & Tasks
  app.get("/api/projects", async (req, res) => {
    try {
      const projectList = await db.select().from(projects).orderBy(desc(projects.createdAt));
      const taskList = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
      res.json({ projects: projectList, tasks: taskList });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Policies
  app.get("/api/policies", async (req, res) => {
    try {
      const list = await db.select().from(policies).orderBy(desc(policies.createdAt));
      res.json(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Fund Requests
  app.get("/api/fund-requests", async (req, res) => {
    try {
      const list = await db.select().from(fundRequests).orderBy(desc(fundRequests.createdAt));
      res.json(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const list = await db.select().from(events).orderBy(desc(events.createdAt));
      res.json(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Overall Dashboard Statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const userList = await db.select().from(users);
      const letterList = await db.select().from(letters);
      const leaveList = await db.select().from(leaveRequests);
      const attendanceList = await db.select().from(attendances);

      const incomingLetters = letterList.filter((l) => l.type === "masuk").length;
      const outgoingLetters = letterList.filter((l) => l.type === "keluar").length;
      const totalEmployees = userList.length;
      const pendingLeaves = leaveList.filter((l) => l.status === "pending").length;
      const presentToday = attendanceList.filter((a) => a.status === "hadir").length;

      res.json({
        totalEmployees,
        incomingLetters,
        outgoingLetters,
        pendingLeaves,
        presentToday,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Organizations list
  app.get("/api/organizations", async (req, res) => {
    try {
      const orgList = await db.select().from(organizations);
      res.json(orgList);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // In-memory platform settings store fallback
  let platformSettingsCache = {
    platformName: "Sistem Informasi Manajemen Terpadu (SIM Enterprise)",
    platformDescription: "Platform Tata Kelola Organisasi, HRIS, E-Surat & Dashboard Eksekutif Terpadu",
    supportEmail: "admin@enterprise.local",
    allowSelfRegistration: true,
    requireOrgApproval: true,
    defaultTrialDays: 30,
    defaultMaxEmployees: 25,
    sessionTimeoutMinutes: 60,
    enforceTwoFactorForAdmins: false,
    strictTenantIsolation: true,
    auditLogRetentionDays: 365,
    maintenanceMode: false,
    primarySuperAdminEmail: "parno86@gmail.com",
    isInitialized: true,
    updatedAt: new Date().toISOString(),
  };

  // Platform Settings GET
  app.get("/api/platform/settings", (req, res) => {
    res.json(platformSettingsCache);
  });

  // Platform Settings POST
  app.post("/api/platform/settings", (req, res) => {
    try {
      const body = req.body || {};
      platformSettingsCache = {
        ...platformSettingsCache,
        ...body,
        updatedAt: new Date().toISOString(),
      };
      res.json({ success: true, settings: platformSettingsCache });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Platform Super Admins List GET
  app.get("/api/platform/super-admins", async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      const allOrgs = await db.select().from(organizations);
      const orgMap = new Map(allOrgs.map((o) => [o.id, o.name]));

      const superAdmins = allUsers
        .filter((u) => u.role === "super_admin")
        .map((u) => ({
          ...u,
          orgName: u.organizationId ? orgMap.get(u.organizationId) || "Platform Global" : "Platform Global",
        }));

      const orgAdmins = allUsers
        .filter((u) => u.role === "admin" || u.role === "hr_manager")
        .map((u) => ({
          ...u,
          orgName: u.organizationId ? orgMap.get(u.organizationId) || "Tanpa Organisasi" : "Tanpa Organisasi",
        }));

      res.json({
        superAdmins,
        orgAdmins,
        organizations: allOrgs,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Designate Super Admin / Org Admin POST
  app.post("/api/platform/super-admins/designate", async (req, res) => {
    try {
      const { targetUserId, email, name, organizationId, role = "super_admin", jobTitle, isPrimary, confirmationPhrase } = req.body || {};

      if (
        !confirmationPhrase ||
        (confirmationPhrase.trim().toUpperCase() !== "KONFIRMASI SUPER ADMIN" && confirmationPhrase.trim().toUpperCase() !== "SETUJU")
      ) {
        return res.status(400).json({
          error: 'Frasa verifikasi keamanan tidak sesuai. Harap ketik "KONFIRMASI SUPER ADMIN".',
        });
      }

      let updatedUserId = targetUserId;
      if (targetUserId) {
        await db
          .update(users)
          .set({
            role,
            accountStatus: "active",
            jobTitle: jobTitle || (role === "super_admin" ? "Super Administrator" : "Organization Admin"),
            organizationId: organizationId || undefined,
          })
          .where(eq(users.id, Number(targetUserId)));
      } else if (email) {
        const found = await db.select().from(users).where(eq(users.email, email.trim())).limit(1);
        if (found.length > 0) {
          updatedUserId = found[0].id;
          await db
            .update(users)
            .set({
              role,
              accountStatus: "active",
              jobTitle: jobTitle || found[0].jobTitle || (role === "super_admin" ? "Super Administrator" : "Organization Admin"),
              organizationId: organizationId || found[0].organizationId,
            })
            .where(eq(users.id, found[0].id));
        } else {
          const inserted = await db.insert(users).values({
            email: email.trim(),
            name: name || "Administrator",
            role,
            jobTitle: jobTitle || (role === "super_admin" ? "Super Administrator" : "Organization Admin"),
            accountStatus: "active",
            organizationId: organizationId || 1,
          }).returning();
          updatedUserId = inserted[0]?.id;
        }
      }

      if (isPrimary && email) {
        platformSettingsCache.primarySuperAdminEmail = email;
      }

      res.json({ success: true, userId: updatedUserId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Dedicated PostgreSQL Query & Mutation Endpoints
  app.post("/api/pg/query", async (req, res) => {
    try {
      const { name, args } = req.body || {};
      const value = await handlePostgresQuery(name, args);
      res.json({ status: "success", value });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Query failed";
      res.status(500).json({ status: "error", errorMessage: message });
    }
  });

  app.post("/api/pg/mutation", async (req, res) => {
    try {
      const { name, args } = req.body || {};
      const value = await handlePostgresMutation(name, args);
      res.json({ status: "success", value });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Mutation failed";
      res.status(500).json({ status: "error", errorMessage: message });
    }
  });

  // Convex compatibility query & mutation endpoints
  app.post("/api/query", async (req, res) => {
    try {
      const name = req.body?.path || req.body?.name || "";
      const args = req.body?.args?.[0] || req.body?.args || {};
      const value = await handlePostgresQuery(name, args);
      res.json({ status: "success", value });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Query failed";
      res.status(500).json({ status: "error", errorMessage: message });
    }
  });

  app.post("/api/mutation", async (req, res) => {
    try {
      const name = req.body?.path || req.body?.name || "";
      const args = req.body?.args?.[0] || req.body?.args || {};
      const value = await handlePostgresMutation(name, args);
      res.json({ status: "success", value });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Mutation failed";
      res.status(500).json({ status: "error", errorMessage: message });
    }
  });

  app.post("/api/action", async (req, res) => {
    try {
      const name = req.body?.path || req.body?.name || "";
      const args = req.body?.args?.[0] || req.body?.args || {};
      const value = await handlePostgresMutation(name, args);
      res.json({ status: "success", value });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed";
      res.status(500).json({ status: "error", errorMessage: message });
    }
  });

  app.get(["/version", "/api/version"], (req, res) => {
    res.json({ version: "0.1.0", backend: "postgresql" });
  });

  // Vite Middleware for development / Static file serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler
  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled API error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    res.status(500).json({ error: message });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

