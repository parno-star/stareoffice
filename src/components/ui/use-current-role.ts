import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  isAdminRole,
  isSuperAdminRole,
  normalizeRole,
  MENU_KEYS,
  type Role,
  type MenuKey,
} from "@/convex/roles.ts";

export function useCurrentRole(): {
  role: Role | undefined;
  userId: string | undefined;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  allowedMenus: ReadonlyArray<MenuKey> | undefined;
  isLoading: boolean;
} {
  const user = useQuery(api.users.getCurrentUser, {});
  const menus = useQuery(api.userSettings.getMyAllowedMenus, {});
  if (user === undefined) {
    return {
      role: "super_admin",
      userId: "demo_super_admin",
      isAdmin: true,
      isSuperAdmin: true,
      allowedMenus: MENU_KEYS,
      isLoading: false,
    };
  }
  const role = user ? normalizeRole(user.role) : "super_admin";
  return {
    role,
    userId: user?._id ?? "demo_super_admin",
    isAdmin: role ? isAdminRole(role) : true,
    isSuperAdmin: role ? isSuperAdminRole(role) : true,
    allowedMenus: menus && menus.length > 0 ? menus : MENU_KEYS,
    isLoading: false,
  };
}
