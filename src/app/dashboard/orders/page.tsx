import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { OrdersView } from "@/features/dashboard/components/dashboard-views";

export default function OrdersPage() {
  return (
    <DashboardShell
      section="orders"
      title="Order Management"
      description="Monitor customer orders and inquiry requests with real-time tracking."
    >
      <OrdersView />
    </DashboardShell>
  );
}
