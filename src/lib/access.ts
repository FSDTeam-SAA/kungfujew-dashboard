export const staffRoles = [
  "admin",
  "operations_manager",
  "story_manager",
] as const;

export type StaffRole = (typeof staffRoles)[number];
export type DashboardArea = "operations" | "stories" | "users" | "settings";

const allowedAreas: Record<StaffRole, readonly DashboardArea[]> = {
  admin: ["operations", "stories", "users", "settings"],
  operations_manager: ["operations", "settings"],
  story_manager: ["stories", "settings"],
};

export function isStaffRole(value: unknown): value is StaffRole {
  return staffRoles.some((role) => role === value);
}

export function canAccess(role: unknown, area: DashboardArea | null): boolean {
  return (
    area !== null && isStaffRole(role) && allowedAreas[role].includes(area)
  );
}

export function areaForPath(pathname: string): DashboardArea | null {
  if (/^\/dashboard\/stories(?:\/|$)/.test(pathname)) return "stories";
  if (/^\/dashboard\/users(?:\/|$)/.test(pathname)) return "users";
  if (/^\/dashboard\/settings(?:\/|$)/.test(pathname)) return "settings";
  if (
    /^\/dashboard\/?$/.test(pathname) ||
    /^\/dashboard\/(orders|payments|customers)(?:\/|$)/.test(pathname)
  )
    return "operations";
  return null;
}

export function landingForRole(role: StaffRole): string {
  return role === "story_manager" ? "/dashboard/stories" : "/dashboard";
}
