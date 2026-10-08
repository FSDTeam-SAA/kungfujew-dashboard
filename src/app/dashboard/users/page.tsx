import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { UsersView } from "@/features/users/components/users-view";

export default function UsersPage() {
  return (
    <DashboardShell
      section="users"
      title="Staff accounts"
      description="Manage dashboard access for staff."
    >
      <UsersView />
    </DashboardShell>
  );
}
