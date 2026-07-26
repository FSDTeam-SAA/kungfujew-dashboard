import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { CustomersView } from "@/features/dashboard/components/dashboard-views";

export default function CustomersPage() {
  return (
    <DashboardShell
      section="customers"
      title="Customer Directory"
      description="View shipment customers and their order history."
    >
      <CustomersView />
    </DashboardShell>
  );
}
