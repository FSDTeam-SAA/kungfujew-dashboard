import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { OverviewView } from "@/features/dashboard/components/dashboard-views";

export default function DashboardPage() {
  return (
    <DashboardShell
      section="overview"
      title="Dashboard Overview"
      description="Monitor orders, revenue & dispatch activity"
    >
      <OverviewView />
    </DashboardShell>
  );
}
