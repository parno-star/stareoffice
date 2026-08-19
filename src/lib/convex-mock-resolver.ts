import { getFunctionName } from "convex/server";
import { MENU_KEYS } from "../convex/roles";
import {
  MOCK_ORGANIZATION,
  MOCK_CURRENT_USER,
  MOCK_USERS,
  MOCK_DEPARTMENTS,
  MOCK_LETTERS,
  MOCK_ATTENDANCE_TODAY,
  MOCK_LEAVE_REQUESTS,
  MOCK_EXPENSES,
  MOCK_FUND_REQUESTS,
  MOCK_NEWS,
  MOCK_PROJECTS,
  MOCK_NOTIFICATIONS,
  MOCK_EVENTS,
  MOCK_DOCUMENTS,
  MOCK_SITE_VISIBILITY,
} from "./convex-mock-data";

/** Extracts a searchable name string from any Convex function reference or API path */
export function getQueryName(query: any): string {
  if (query === null || query === undefined) return "";
  if (typeof query === "string") return query;

  try {
    const fnName = getFunctionName(query);
    if (fnName && typeof fnName === "string") return fnName;
  } catch {
    /* ignore fallback */
  }

  try {
    if (typeof query === "object" || typeof query === "function") {
      if (typeof query._name === "string") return query._name;
      if (typeof query.name === "string") return query.name;
      if (typeof query.functionName === "string") return query.functionName;
    }
  } catch {
    /* ignore fallback */
  }

  return "";
}

/** Returns mock data for any query when Convex is disconnected or pending */
export function resolveMockQuery(query: any, args?: any): any {
  if (args === "skip") {
    return undefined;
  }
  const name = getQueryName(query).toLowerCase();

  // Allowed menus for sidebar and permissions
  if (name.includes("allowedmenus") || name.includes("usersettings")) {
    return [...MENU_KEYS];
  }

  // Current user & Auth
  if (name.includes("users:getcurrentuser") || name.includes("getcurrentuser")) {
    return MOCK_CURRENT_USER;
  }
  if (name.includes("role-requests") || name.includes("rolerequests") || name.includes("mypendingrequest")) {
    return null;
  }

  // Tenant / Organization
  if (name.includes("subscription")) {
    return {
      subscription: {
        status: "active",
        paidUntil: "2030-12-31T00:00:00.000Z",
        daysUntilDue: 365,
        isReadOnly: false,
      },
      orgName: MOCK_ORGANIZATION.name,
      isTrial: false,
      planId: null,
      planName: "Pro Plan",
      pricePerUserMonth: 25000,
      userCount: MOCK_USERS.length,
      payments: [],
      pendingPaymentCount: 0,
    };
  }

  if (name.includes("searchforswitcher") || name.includes("search_for_switcher")) {
    const list = [
      { _id: "org_cahya", name: "CAHYA BIMA WIBAWA", isActive: true, userCount: 1, isSampleOrg: false },
      { _id: "org_antwi", name: "PT Antwi Digital Nusantara", isActive: true, userCount: 1, isSampleOrg: false },
      { _id: "org_star_demo", name: "PT DEMO STAR E-OFFICE", isActive: true, userCount: 6, isSampleOrg: true },
      { _id: "org_medianet", name: "PT MEDIANET TECHNOLOGY", isActive: true, userCount: 7, isSampleOrg: false },
      { _id: "org_pratama", name: "PT PRATAMA GLOBAL SISTEM", isActive: true, userCount: 3, isSampleOrg: false },
    ];
    if (args && typeof args === "object" && typeof args.search === "string") {
      const term = args.search.toLowerCase().trim();
      return list.filter((item) => item.name.toLowerCase().includes(term));
    }
    return list;
  }

  if (name.includes("getsampleorgforswitcher") || name.includes("get_sample_org_for_switcher")) {
    return { _id: "org_star_demo", name: "PT DEMO STAR E-OFFICE" };
  }

  if (name.includes("dataaccess:getmyaccessstatus") || name.includes("getmyaccessstatus")) {
    return {
      active: {
        expiresAt: "2030-12-31T23:59:59.000Z",
        scopes: ["letters_documents", "hr_people", "finance_payroll", "communication", "org_settings"]
      },
      pending: null
    };
  }

  if (name.includes("organizations:getmyorganization") || name.includes("getmyorganization")) {
    const viewingId = typeof window !== "undefined" ? localStorage.getItem("viewingOrganizationId") : null;
    if (viewingId) {
      const list = [
        { _id: "org_cahya", name: "CAHYA BIMA WIBAWA", isActive: true, isSampleOrg: false },
        { _id: "org_antwi", name: "PT Antwi Digital Nusantara", isActive: true, isSampleOrg: false },
        { _id: "org_star_demo", name: "PT DEMO STAR E-OFFICE", isActive: true, isSampleOrg: true },
        { _id: "org_medianet", name: "PT MEDIANET TECHNOLOGY", isActive: true, isSampleOrg: false },
        { _id: "org_pratama", name: "PT PRATAMA GLOBAL SISTEM", isActive: true, isSampleOrg: false },
      ];
      const found = list.find((item) => item._id === viewingId);
      if (found) {
        return {
          ...MOCK_ORGANIZATION,
          _id: found._id,
          name: found.name,
          isSampleOrg: found.isSampleOrg,
        };
      }
    }
    return null;
  }
  if (name.includes("organizations:list") || name.includes("listorganizations")) {
    return [MOCK_ORGANIZATION];
  }

  // Celebrations
  if (name.includes("celebration")) {
    return {
      birthdays: [],
      anniversaries: [],
    };
  }

  // Site Landing Settings
  if (name.includes("welcomepage") || name.includes("welcome")) {
    return {
      organizationName: MOCK_ORGANIZATION.name ?? "PT DEMO STAR ORGANISASI",
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
          imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1080",
          caption: "Inovasi Digital Tanpa Batas",
        },
        {
          imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1080",
          caption: "Kolaborasi Tim yang Solid",
        },
        {
          imageUrl: "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&q=80&w=1080",
          caption: "Merayakan Pencapaian Bersama",
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

  if (name.includes("sitesettings") || name.includes("landingsectionvisibility")) {
    return MOCK_SITE_VISIBILITY;
  }

  // Dashboard Stats
  if (name.includes("superadmin:getplatformstats") || name.includes("getplatformstats")) {
    return {
      totalOrganizations: 8,
      activeOrganizations: 8,
      inactiveOrganizations: 0,
      totalUsers: 28,
      activeUsers: 28,
      pendingUsers: 0,
      suspendedUsers: 0,
      usersWithoutOrg: 1,
      planDistribution: [
        { plan: "Poc", count: 4 },
        { plan: "Free", count: 3 },
        { plan: "Enterprise", count: 1 }
      ],
      roleDistribution: [
        { role: "Karyawan", count: 14 },
        { role: "Administrator", count: 9 },
        { role: "HR Manager", count: 4 },
        { role: "Director / C-Level", count: 1 }
      ],
      recentOrganizations: [
        { _id: "org1", name: "PT Antwi Digital Nusantara", plan: "Poc", isActive: true },
        { _id: "org2", name: "CAHYA BIMA WIBAWA", plan: "Poc", isActive: true },
        { _id: "org3", name: "PT PRATAMA GLOBAL SISTEM", plan: "Free", isActive: true },
        { _id: "org4", name: "PT DEMO STAR E-OFFICE", plan: "Enterprise", isActive: true },
        { _id: "org5", name: "PT MEDIANET TECHNOLOGY", plan: "Free", isActive: true }
      ]
    };
  }

  if (name.includes("superadmin:getaccessgovernancesummary") || name.includes("getaccessgovernancesummary")) {
    return {
      totalOrganizations: 8,
      activeGrants: 0,
      pendingRequests: 0,
      coveragePercent: 0,
      activeGrantsList: []
    };
  }

  // Dashboard Stats
  if (name.includes("dashboardstats") || name.includes("eofficestats")) {
    return {
      suratMasuk: 0,
      suratKeluar: 0,
      disposisiPending: 0,
      approvalPending: 0,
      totalKaryawan: 0,
      suratDraft: 0,
      suratBulanIni: 0,
      suratBulanLalu: 0,
    };
  }

  // Quick Access
  if (name.includes("getmyquickaccess")) {
    return [
      "/letters",
      "/attendance",
      "/directory",
      "/projects",
      "/forum",
      "/chatbot",
      "/training",
      "/calendar",
    ];
  }

  // Users & Employee Directory
  if (name.includes("users:list") || name.includes("directory") || name.includes("employees")) {
    if (args && args.userId) {
      return MOCK_USERS.find((u) => u._id === args.userId) || MOCK_CURRENT_USER;
    }
    return MOCK_USERS;
  }

  // Letters & Dispositions
  if (name.includes("letters") || name.includes("letter")) {
    if (name.includes("count") || name.includes("badge") || name.includes("unread") || name.includes("pending")) {
      return 2;
    }
    if (name.includes("previewnextletternumber") || name.includes("generateletternumber")) {
      return "004/SK/DIR/VIII/2026";
    }
    if (name.includes("previewnextagendanumber") || name.includes("generateagendanumber")) {
      return "004";
    }
    if (name.includes("checkduplicateletternumber")) {
      return { isDuplicate: false };
    }
    if (name.includes("listletterheads") || name.includes("letterhead")) {
      return [
        {
          _id: "lh_01",
          name: "Kop Utama Perusahaan",
          organizationName: MOCK_ORGANIZATION.name ?? "PT STAR NUSANTARA DIGITAL",
          organizationAddress: "Jl. Jend. Sudirman No. 123, Jakarta Selatan",
          organizationPhone: "(021) 555-0199",
          organizationEmail: "info@stardigital.co.id",
          organizationWebsite: "www.stardigital.co.id",
          logoUrl: null,
          accentColor: "#1e40af",
          isDefault: true,
        },
      ];
    }
    if (name.includes("listcompanyprefixes") || name.includes("companyprefix")) {
      return [{ _id: "pref_01", code: "DIR", label: "Direksi" }, { _id: "pref_02", code: "HRD", label: "Sumber Daya Manusia" }];
    }
    if (name.includes("listcategoryprefixes") || name.includes("categoryprefix")) {
      return [{ _id: "catp_01", code: "SK", label: "Surat Keputusan" }, { _id: "catp_02", code: "ND", label: "Nota Dinas" }];
    }
    if (name.includes("getletterrecipients") || name.includes("recipient")) {
      return { mode: "individual", recipients: [], department: null };
    }
    if (name.includes("getletterwithextras") || name.includes("getletterdetail") || name.includes("getletter")) {
      return {
        letter: MOCK_LETTERS[0],
        author: MOCK_CURRENT_USER,
        fromUser: MOCK_CURRENT_USER,
        toUser: MOCK_USERS[1] ?? MOCK_CURRENT_USER,
        ccUsers: [],
        approvals: [],
        history: [],
      };
    }
    if (name.includes("listdispositions") || name.includes("getmydispositions")) {
      return [];
    }
    if (name.includes("listapprovals")) {
      return [];
    }
    if (name.includes("memosettings")) {
      return {
        memoTitle: "NOTA DINAS",
        headerStyle: "standard",
      };
    }
    return MOCK_LETTERS;
  }

  // Attendance
  if (name.includes("attendance")) {
    if (name.includes("today") || name.includes("gettodayrecord")) {
      return MOCK_ATTENDANCE_TODAY;
    }
    return [MOCK_ATTENDANCE_TODAY];
  }

  // Leave Requests
  if (name.includes("leave")) {
    if (name.includes("count") || name.includes("badge") || name.includes("unread") || name.includes("pending")) {
      return 1;
    }
    return MOCK_LEAVE_REQUESTS;
  }

  // Reimbursement & Expenses
  if (name.includes("expense")) {
    if (name.includes("count") || name.includes("badge") || name.includes("unread") || name.includes("pending")) {
      return 0;
    }
    return MOCK_EXPENSES;
  }

  // Fund Requests
  if (name.includes("fund")) {
    if (name.includes("count") || name.includes("badge") || name.includes("unread") || name.includes("pending")) {
      return 0;
    }
    return MOCK_FUND_REQUESTS;
  }

  // News & Announcements
  if (name.includes("announcement") || name.includes("news")) {
    return MOCK_NEWS;
  }

  // Messages
  if (name.includes("message") || name.includes("conversation")) {
    if (name.includes("unread") || name.includes("count") || name.includes("badge")) return 0;
    return [];
  }

  // Projects & Tasks
  if (name.includes("project") || name.includes("task")) {
    if (name.includes("count") || name.includes("badge") || name.includes("unread")) return 0;
    return MOCK_PROJECTS;
  }

  // Notifications
  if (name.includes("notification")) {
    if (name.includes("count") || name.includes("badge") || name.includes("unread")) return 0;
    return MOCK_NOTIFICATIONS;
  }

  // Events & Calendar
  if (name.includes("event") || name.includes("calendar")) {
    return MOCK_EVENTS;
  }

  // Documents
  if (name.includes("document")) {
    return MOCK_DOCUMENTS;
  }

  // Departments & Org Structure
  if (name.includes("department") || name.includes("structure") || name.includes("organization")) {
    return MOCK_DEPARTMENTS;
  }

  // Numeric count / badge / unread helpers
  if (
    name.includes("count") ||
    name.includes("total") ||
    name.includes("badge") ||
    name.includes("unread") ||
    name.includes("pending")
  ) {
    return 0;
  }

  // Single entity getters
  if (
    name.includes("getbyid") ||
    name.includes("getone") ||
    name.includes("findone") ||
    name.includes("getdetail")
  ) {
    return null;
  }

  // Default fallback for any query is an empty array so lists do not throw on .map()
  return [];
}

