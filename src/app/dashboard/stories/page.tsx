import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import StoriesView from "@/features/content/components/stories-view";

export default function Page() {
  return (
    <DashboardShell
      section="stories"
      title="Shipment Stories"
      description="Create and manage stories."
    >
      <StoriesView />
    </DashboardShell>
  );
}
