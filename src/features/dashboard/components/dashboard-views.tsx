"use client";

import Link from "next/link";
import {
  ArrowRight,
  Box,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  Eye,
  MapPin,
  PackageCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCustomer,
  useCustomers,
  useDashboardSummary,
  useOrder,
  useOrders,
  useOrderActions,
  usePayments,
} from "../hooks/use-dashboard";
import type { OrderRecord } from "../types";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
function State({ loading, error }: { loading: boolean; error: Error | null }) {
  if (loading) return <p role="status">Loading…</p>;
  return error ? <p role="alert">{error.message}</p> : null;
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white">
      <h2 className="border-b px-6 py-4 text-lg font-semibold">{title}</h2>
      <div className="p-6">{children}</div>
    </section>
  );
}
function Table({
  orders,
  payments = false,
}: {
  orders: OrderRecord[];
  payments?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Order</th>
            <th>{payments ? "Payment" : "Route"}</th>
            <th>{payments ? "Balance" : "Status"}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order.customerName}</td>
              <td>{order.orderId}</td>
              <td>
                {payments
                  ? `${order.paymentMethod || "Unpaid"} · ${money.format(order.depositAmountCalculated)}`
                  : `${order.pickupLocation} → ${order.deliveryLocation}`}
              </td>
              <td>
                {payments
                  ? money.format(order.balanceAmountRemaining)
                  : order.status}
              </td>
              <td>
                <Link href={`/dashboard/orders/${order.orderId}`}>Details</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && <p>No records found.</p>}
    </div>
  );
}

export function OverviewView() {
  const query = useDashboardSummary();
  if (query.isLoading || query.error)
    return <State loading={query.isLoading} error={query.error} />;
  const data = query.data;
  if (!data) return null;
  const pendingActions = data.statusCounts
    .filter(({ status }) =>
      ["Pending Payment", "Booked", "Quote Generated"].includes(status),
    )
    .reduce((total, item) => total + item.count, 0);
  const averageOrderValue =
    data.totalOrders > 0 ? data.totalQuotedValue / data.totalOrders : 0;
  const attention = data.recentOrders
    .filter(
      (order) =>
        !order.pickupLocation ||
        !order.deliveryLocation ||
        order.status === "Pending Payment" ||
        !order.isReviewedByStaff,
    )
    .slice(0, 4);
  const values = data.recentOrders
    .slice()
    .reverse()
    .map((order) => order.grandTotalPrice);
  const maximum = Math.max(...values, 1);
  const points = values
    .map(
      (value, index) =>
        `${(index / Math.max(values.length - 1, 1)) * 100},${100 - (value / maximum) * 80}`,
    )
    .join(" ");
  const cards = [
    ["Total Orders", data.totalOrders.toLocaleString(), Box],
    ["Quoted Value", money.format(data.totalQuotedValue), CircleDollarSign],
    ["Pending Actions", pendingActions.toLocaleString(), ClipboardCheck],
    ["Average Order Value", money.format(averageOrderValue), CreditCard],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <article
            key={label}
            className="flex h-[139px] items-center justify-between rounded-lg bg-white p-4 shadow-[0_4px_3px_rgba(0,0,0,0.1)]"
          >
            <div>
              <p className="text-[40px] font-semibold leading-tight text-[#1d2b4f]">
                {value}
              </p>
              <p className="mt-1 text-xs text-[#6c757d]">{label}</p>
            </div>
            <span className="grid size-[50px] place-items-center rounded-full bg-[#e8eaed] text-[#1d2b4f]">
              <Icon className="size-6" />
            </span>
          </article>
        ))}
      </section>

      <Panel title="Platform Growth">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-64 w-full"
          aria-label="Recent quoted order value trend"
          role="img"
        >
          <polyline
            points={points || "0,100 100,100"}
            fill="none"
            stroke="#1d2b4f"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="flex justify-between text-xs text-[#6c757d]">
          <span>Oldest</span>
          <span>Most recent</span>
        </div>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_323px]">
        <Panel title="Needs Attention">
          {attention.map((order) => (
            <Link
              key={order._id}
              href={`/dashboard/orders/${order.orderId}`}
              className="flex items-center gap-3 border-b py-4 last:border-0"
            >
              <span className="grid size-10 place-items-center rounded-full bg-[#fff7ed] text-[#e66d00]">
                <MapPin className="size-5" />
              </span>
              <span>
                <span className="block text-lg text-[#1d2b4f]">
                  {order.status === "Pending Payment"
                    ? "Payment pending"
                    : !order.isReviewedByStaff
                      ? "Order needs review"
                      : "Location needs review"}
                </span>
                <span className="block text-sm text-[#999]">
                  {order.orderId}
                </span>
              </span>
            </Link>
          ))}
          {!attention.length && (
            <p className="py-6 text-sm text-[#6c757d]">
              No orders need immediate attention.
            </p>
          )}
          <Link
            href="/dashboard/orders"
            className="mt-4 inline-flex items-center gap-2 font-bold text-[#1d2b4f]"
          >
            View all orders <ArrowRight className="size-4" />
          </Link>
        </Panel>

        <aside className="rounded-lg bg-white p-6 shadow-[0_4px_3px_rgba(0,0,0,0.1)]">
          <h2 className="text-2xl font-bold text-[#1d2b4f]">Quick Actions</h2>
          <p className="mb-6 text-sm text-[#6b6b6b]">Common tasks</p>
          <div className="space-y-4">
            <Link
              href="/dashboard/orders"
              className="flex items-center justify-between rounded-[14px] border p-5"
            >
              <span>
                <span className="block text-lg text-[#687189]">
                  View Orders
                </span>
                <span className="text-sm text-[#6b6b6b]">Review pipeline</span>
              </span>
              <PackageCheck className="size-5" />
            </Link>
            <Link
              href="/dashboard/payments"
              className="flex items-center justify-between rounded-[14px] border p-5"
            >
              <span>
                <span className="block text-lg text-[#687189]">
                  Review Payments
                </span>
                <span className="text-sm text-[#6b6b6b]">Manage balances</span>
              </span>
              <TrendingUp className="size-5" />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
export function OrdersView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const actions = useOrderActions();
  const query = useOrders({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });
  if (query.isLoading || query.error)
    return <State loading={query.isLoading} error={query.error} />;
  const orders = query.data?.items || [];
  const meta = query.data?.meta;

  const reject = (orderId: string) => {
    if (
      window.confirm(`Reject order ${orderId}? This will cancel the order.`)
    ) {
      actions.reject.mutate({ orderId });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#e4e7ec] bg-white p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by customer, order ID, phone, or route"
            className="h-12 border-[#d0d5dd]"
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter orders by status"
            className="h-12 rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm text-[#475467]"
          >
            <option value="">All statuses</option>
            <option value="Quote Generated">Quote Generated</option>
            <option value="Pending Payment">Pending Payment</option>
            <option value="Booked">Booked</option>
            <option value="Approved">Approved</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </section>

      {actions.approve.error || actions.reject.error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {(actions.approve.error || actions.reject.error)?.message}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-[#e4e7ec] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[#eff4ff] text-xs font-semibold uppercase tracking-wide text-[#4a5572]">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Order Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaecf0]">
              {orders.map((order) => {
                const canApprove = order.status === "Booked";
                const canReject = ![
                  "Approved",
                  "Dispatched",
                  "Delivered",
                  "Cancelled",
                ].includes(order.status);
                return (
                  <tr key={order._id} className="h-[76px] text-[#344054]">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#061639]">
                        {order.customerName}
                      </p>
                      <p className="mt-1 text-xs text-[#667085]">
                        {order.customerEmail}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#012055]">
                      {order.orderId}
                    </td>
                    <td className="max-w-72 px-6 py-4 text-[#667085]">
                      <p className="truncate">{order.pickupLocation}</p>
                      <p className="truncate">→ {order.deliveryLocation}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#061639]">
                      {money.format(order.grandTotalPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-[#012055] text-[#012055]"
                        >
                          <Link
                            href={`/dashboard/orders/${order.orderId}`}
                            aria-label={`View order ${order.orderId}`}
                          >
                            <Eye /> View details
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          disabled={!canApprove || actions.approve.isPending}
                          onClick={() => actions.approve.mutate(order.orderId)}
                          className="bg-[#012055] text-white hover:bg-[#1d2b4f]"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canReject || actions.reject.isPending}
                          onClick={() => reject(order.orderId)}
                          className="border-[#b42318] text-[#b42318] hover:bg-red-50 hover:text-[#b42318]"
                        >
                          <X /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!orders.length ? (
          <p className="p-10 text-center text-sm text-[#667085]">
            No orders match the current filters.
          </p>
        ) : null}
        {meta ? (
          <div className="flex items-center justify-between border-t border-[#eaecf0] px-6 py-4 text-sm text-[#667085]">
            <span>
              Showing {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
              orders
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
export function CustomersView() {
  const query = useCustomers({ page: 1, limit: 20 });
  if (query.isLoading || query.error)
    return <State loading={query.isLoading} error={query.error} />;
  return (
    <Panel title="Customers">
      <ul className="space-y-3">
        {query.data?.items.map((customer) => (
          <li key={customer.email} className="flex justify-between">
            <span>
              {customer.customerName} — {customer.email}
            </span>
            <Link
              href={`/dashboard/customers/${encodeURIComponent(customer.email)}`}
            >
              Details
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
export function OrderDetailsView({ orderId }: { orderId: string }) {
  const query = useOrder(orderId);
  const actions = useOrderActions();
  if (query.isLoading || query.error)
    return <State loading={query.isLoading} error={query.error} />;
  const order = query.data;
  if (!order) return null;
  const canApprove = order.status === "Booked";
  const canReject = ![
    "Approved",
    "Dispatched",
    "Delivered",
    "Cancelled",
  ].includes(order.status);
  const paymentPercent =
    order.grandTotalPrice > 0
      ? Math.min(
          100,
          ((order.grandTotalPrice - order.balanceAmountRemaining) /
            order.grandTotalPrice) *
            100,
        )
      : 0;
  const reject = () => {
    if (
      window.confirm(
        `Reject order ${order.orderId}? This will cancel the order.`,
      )
    ) {
      actions.reject.mutate({ orderId: order.orderId });
    }
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,810px)_minmax(340px,1fr)]">
      <div className="space-y-6">
        <DetailCard title="Customer Information">
          <DetailGrid
            fields={[
              ["Full name", order.customerName],
              ["Email address", order.customerEmail],
              ["Phone number", order.customerPhone],
              ["Order status", order.status],
            ]}
          />
        </DetailCard>
        <DetailCard title="Logistics Information">
          <div className="relative space-y-10 pl-16 before:absolute before:bottom-12 before:left-6 before:top-12 before:border-l before:border-dashed before:border-[#c5c6cf]">
            <LogisticsStop
              label="Pickup details"
              location={order.pickupLocation}
              date={order.pickupAvailableDate}
            />
            <LogisticsStop
              label="Delivery details"
              location={order.deliveryLocation}
              date={order.deliveryAvailableDate}
              delivery
            />
          </div>
        </DetailCard>
        <DetailCard title="Vehicle Information">
          <DetailGrid
            fields={[
              [
                "Vehicle",
                `${order.vehicleYear} ${order.vehicleMake} ${order.vehicleModel}`,
              ],
              ["Vehicle type", order.vehicleType],
              ["Condition", order.condition],
              ["Transport", order.transportType],
              ["Timeline", order.timelineType],
              ["Freight weight", `${order.inCarFreightWeight || 0} lbs`],
            ]}
          />
          {order.adminNotes ? (
            <div className="mt-6 rounded-lg bg-[#f6f3f2] p-4 text-sm italic text-[#45464e]">
              “{order.adminNotes}”
            </div>
          ) : null}
        </DetailCard>
      </div>
      <aside className="space-y-6">
        <section className="rounded-lg bg-[#4a5572] p-6 text-white">
          <h2 className="text-xl font-semibold">Financial Breakdown</h2>
          <div className="mt-7 space-y-4 text-sm">
            <FinancialRow
              label="Subtotal"
              value={money.format(order.subTotal)}
            />
            <FinancialRow
              label="Deposit paid"
              value={money.format(order.depositAmountCalculated)}
            />
            <div className="border-t border-white/15 pt-4">
              <FinancialRow
                label="Balance due"
                value={money.format(order.balanceAmountRemaining)}
                strong
              />
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-[#dae2ff]"
                  style={{ width: `${paymentPercent}%` }}
                />
              </div>
              <p className="mt-2 text-right text-xs italic text-white/60">
                Due upon carrier dispatch
              </p>
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <Button
              className="h-12 w-full bg-[#012055] text-white hover:bg-[#061639]"
              disabled={
                actions.reminder.isPending || order.balanceAmountRemaining <= 0
              }
              onClick={() => actions.reminder.mutate(order.orderId)}
            >
              Request Remaining Payment
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full border-[#dae2ff] bg-transparent text-white hover:bg-white/10 hover:text-white"
              disabled
            >
              Mark As Fully Paid
            </Button>
          </div>
        </section>
        <section className="rounded-lg border border-[#c5c6cf]/30 bg-[#eff4ff] p-6 shadow-[0_4px_10px_rgba(29,43,79,0.05)]">
          <h2 className="text-base font-bold uppercase tracking-[0.1em] text-[#061639]">
            Admin Control Panel
          </h2>
          {actions.approve.error ||
          actions.reject.error ||
          actions.reminder.error ? (
            <p role="alert" className="mt-4 text-sm text-[#b42318]">
              {
                (
                  actions.approve.error ||
                  actions.reject.error ||
                  actions.reminder.error
                )?.message
              }
            </p>
          ) : null}
          <div className="mt-6 space-y-3">
            <Button
              className="h-12 w-full bg-[#1d2b4f] text-white hover:bg-[#012055]"
              disabled={!canApprove || actions.approve.isPending}
              onClick={() => actions.approve.mutate(order.orderId)}
            >
              Approve Order
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full border-[#012055] text-[#061639] hover:bg-white"
              disabled={!canReject || actions.reject.isPending}
              onClick={reject}
            >
              Reject Order
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full border-[#012055] text-[#061639] hover:bg-white"
            >
              <a href={`tel:${order.customerPhone}`}>Call Customer</a>
            </Button>
          </div>
        </section>
      </aside>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const tone =
    status === "Approved" || status === "Delivered"
      ? "bg-[#ecfdf3] text-[#027a48]"
      : status === "Cancelled"
        ? "bg-[#fef3f2] text-[#b42318]"
        : status === "Booked"
          ? "bg-[#eff4ff] text-[#175cd3]"
          : "bg-[#fffaeb] text-[#b54708]";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}
    >
      {status}
    </span>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#c5c6cf]/30 bg-white p-6">
      <h2 className="mb-7 text-xl font-semibold text-[#1b1c1c]">{title}</h2>
      {children}
    </section>
  );
}

function DetailGrid({
  fields,
}: {
  fields: Array<[string, string | number | undefined]>;
}) {
  return (
    <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-semibold uppercase tracking-[0.05em] text-[#595f68]">
            {label}
          </dt>
          <dd className="mt-1 text-base text-[#061639]">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function LogisticsStop({
  label,
  location,
  date,
  delivery = false,
}: {
  label: string;
  location: string;
  date?: string;
  delivery?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute -left-16 grid size-12 place-items-center rounded-full bg-[#061639] text-lg text-white">
        {delivery ? "↓" : "↑"}
      </span>
      <p className="text-xs font-medium uppercase tracking-[0.05em] text-[#595f68]">
        {label}
      </p>
      <div className="mt-2 rounded-lg bg-[#f8faff] p-4">
        <DetailGrid
          fields={[
            ["Location", location],
            [
              "Available date",
              date ? new Date(date).toLocaleDateString() : undefined,
            ],
          ]}
        />
      </div>
    </div>
  );
}

function FinancialRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${strong ? "text-base font-semibold" : "text-white/75"}`}
    >
      <span>{label}</span>
      <span className={strong ? "text-2xl text-white" : "text-white"}>
        {value}
      </span>
    </div>
  );
}
export function CustomerDetailsView({ email }: { email: string }) {
  const query = useCustomer(email);
  if (query.isLoading || query.error)
    return <State loading={query.isLoading} error={query.error} />;
  if (!query.data) return null;
  return (
    <div className="space-y-4">
      <Panel title={query.data.customer.customerName}>
        <p>{query.data.customer.customerEmail}</p>
        <p>{query.data.customer.customerPhone}</p>
      </Panel>
      <Panel title="Orders">
        <Table orders={query.data.orders} />
      </Panel>
    </div>
  );
}
export function PaymentsView() {
  const [balanceDue, setBalanceDue] = useState(false);
  const [search, setSearch] = useState("");
  const query = usePayments({
    page: 1,
    limit: 20,
    balanceDue,
    search: search || undefined,
  });
  const summary = useDashboardSummary();
  if (query.isLoading || query.error || summary.isLoading || summary.error)
    return (
      <State
        loading={query.isLoading || summary.isLoading}
        error={query.error || summary.error}
      />
    );
  const payments = query.data;
  const metrics = summary.data;
  if (!payments || !metrics) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e6e7e6] bg-white p-6">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search orders, customers..."
          className="h-11"
        />
      </div>
      <section className="grid gap-6 lg:grid-cols-3">
        <PaymentMetric
          label="Total Collected"
          value={money.format(metrics.collectedDeposits)}
          detail={`From ${metrics.totalOrders} orders`}
          className="bg-[#00be4b]"
        />
        <PaymentMetric
          label="Pending Balance"
          value={money.format(metrics.outstandingBalance)}
          detail={`${payments.items.filter((order) => order.balanceAmountRemaining > 0).length} visible orders pending`}
          className="bg-[#f85300]"
        />
        <PaymentMetric
          label="Collected Today"
          value="$0"
          detail="Placeholder — payment timestamps are not available"
          className="bg-[#1c68fe]"
        />
      </section>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-[#68706a]">
          <input
            type="checkbox"
            checked={balanceDue}
            onChange={(event) => setBalanceDue(event.target.checked)}
          />
          Balance due only
        </label>
        <span className="text-[#68706a]">
          Showing {payments.items.length} of {payments.meta.total} results
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#e6e7e6] bg-white">
        <table className="w-full min-w-[980px] text-center text-sm">
          <thead className="bg-[#e8eaed] text-[#1d2b4f]">
            <tr>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Payment Progress</th>
              <th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.items.map((order) => {
              const paid = Math.max(
                0,
                order.grandTotalPrice - order.balanceAmountRemaining,
              );
              const progress =
                order.grandTotalPrice > 0
                  ? Math.min(100, (paid / order.grandTotalPrice) * 100)
                  : 0;
              const status = order.isBalancePaid
                ? "Full Paid"
                : order.isDepositPaid
                  ? "Deposit"
                  : "Pending";
              const statusClass = order.isBalancePaid
                ? "bg-[#f0fdf4] text-[#008236]"
                : order.isDepositPaid
                  ? "bg-[#fefce8] text-[#a65f00]"
                  : "bg-[#fef2f2] text-[#c10007]";
              return (
                <tr key={order._id} className="border-t border-[#e6e7e6]">
                  <td className="px-4 py-5 font-bold text-left">
                    {order.customerName}
                  </td>
                  <td className="px-4 py-5 text-[#6c757d]">{order.orderId}</td>
                  <td className="px-4 py-5 text-[#6c757d]">
                    {money.format(order.grandTotalPrice)}
                  </td>
                  <td className="px-4 py-5">
                    <div className="mx-auto max-w-28 text-left text-[10px]">
                      {money.format(paid)} paid
                      <div className="mt-1 h-1.5 overflow-hidden rounded bg-[#e5e7eb]">
                        <div
                          className="h-full rounded bg-[#00be4b]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-[#6c757d]">
                    {money.format(order.balanceAmountRemaining)}
                  </td>
                  <td className="px-4 py-5 text-[#6c757d]">
                    {order.paymentMethod || "—"}
                  </td>
                  <td className="px-4 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${statusClass}`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!payments.items.length && (
          <p className="p-10 text-center text-sm text-[#6c757d]">
            No payment records found.
          </p>
        )}
      </div>
    </div>
  );
}

function PaymentMetric({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: string;
  detail: string;
  className: string;
}) {
  return (
    <article className={`rounded-lg p-6 text-white ${className}`}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-white/90">{detail}</p>
    </article>
  );
}
export function SettingsView() {
  return (
    <Panel title="Settings">
      <p>
        Profile and administration settings are available through the protected
        API.
      </p>
    </Panel>
  );
}
