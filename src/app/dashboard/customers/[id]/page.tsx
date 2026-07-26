import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { CustomerDetailsView } from "@/features/dashboard/components/dashboard-views";

export default async function CustomerQueryDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DashboardShell
      section="customers"
      title="Customer Details"
      description="Review customer shipment history."
    >
      <CustomerDetailsView email={decodeURIComponent(id)} />
    </DashboardShell>
  );
}
