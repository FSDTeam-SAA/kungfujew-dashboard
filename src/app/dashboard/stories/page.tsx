import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { StoriesView } from "@/features/stories/components/stories-view";

export default function StoriesPage() {
  return (
    <DashboardShell
      section="stories"
      title="Shipment stories"
      description="Create, review, and publish shipment stories."
    >
      <StoriesView />
    </DashboardShell>
  );
}
