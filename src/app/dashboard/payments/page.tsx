import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { PaymentsView } from "@/features/dashboard/components/dashboard-views";

export default function PaymentsPage() {
  return (
    <DashboardShell
      section="payments"
      title="Payments"
      description="Review payment collection and transaction history."
    >
      <PaymentsView />
    </DashboardShell>
  );
}
