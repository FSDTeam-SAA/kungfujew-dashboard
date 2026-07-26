import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { SettingsView } from "@/features/dashboard/components/dashboard-views";

export default function SettingsPage() {
  return (
    <DashboardShell
      section="settings"
      title="Settings"
      description="Manage account preferences and notification settings."
    >
      <SettingsView />
    </DashboardShell>
  );
}
