import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { OrderDetailsView } from "@/features/dashboard/components/dashboard-views";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DashboardShell
      section="orders"
      title="Order Details"
      description={`Review shipment and payment information for ${id}.`}
    >
      <OrderDetailsView orderId={id} />
    </DashboardShell>
  );
}
