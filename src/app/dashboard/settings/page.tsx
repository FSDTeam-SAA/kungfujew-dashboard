import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import SettingsView from "@/features/content/components/settings-view";

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
