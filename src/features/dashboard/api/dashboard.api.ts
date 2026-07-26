import { api } from "@/lib/api";

import type {
  ApiEnvelope,
  Carrier,
  ContactInquiry,
  CustomerDetails,
  CustomerRecord,
  DashboardSummary,
  ManualPaymentInput,
  OrderQuery,
  OrderRecord,
  PaginatedResponse,
  PricingPreset,
  UserProfile,
} from "../types";

async function unwrap<T>(
  request: Promise<{ data: ApiEnvelope<T> }>,
): Promise<T> {
  return (await request).data.data;
}

export function getDashboardSummary() {
  return unwrap(
    api.get<ApiEnvelope<DashboardSummary>>("/admin/dashboard/summary"),
  );
}

export function getOrders(params: OrderQuery) {
  return unwrap(
    api.get<ApiEnvelope<PaginatedResponse<OrderRecord>>>("/admin/orders", {
      params,
    }),
  );
}

export function getOrder(orderId: string) {
  return unwrap(api.get<ApiEnvelope<OrderRecord>>(`/admin/orders/${orderId}`));
}

export function getCustomers(params: OrderQuery) {
  return unwrap(
    api.get<ApiEnvelope<PaginatedResponse<CustomerRecord>>>(
      "/admin/customers",
      { params },
    ),
  );
}

export function getCustomer(email: string) {
  return unwrap(
    api.get<ApiEnvelope<CustomerDetails>>(
      `/admin/customers/${encodeURIComponent(email)}`,
    ),
  );
}

export function getPayments(params: OrderQuery) {
  return unwrap(
    api.get<ApiEnvelope<PaginatedResponse<OrderRecord>>>("/admin/payments", {
      params,
    }),
  );
}

export function updateOrderPrice(
  orderId: string,
  input: Record<string, number | string>,
) {
  return unwrap(
    api.patch<ApiEnvelope<OrderRecord>>(
      `/admin/orders/${orderId}/price`,
      input,
    ),
  );
}

export function reviewOrder(orderId: string, notes?: string) {
  return unwrap(
    api.patch<ApiEnvelope<OrderRecord>>(`/admin/orders/${orderId}/review`, {
      notes,
    }),
  );
}

export function confirmManualPayment(
  orderId: string,
  input: ManualPaymentInput,
) {
  return unwrap(
    api.patch<ApiEnvelope<OrderRecord>>(
      `/admin/orders/${orderId}/manual-payment`,
      input,
    ),
  );
}

export function approveOrder(orderId: string) {
  return unwrap(
    api.post<ApiEnvelope<OrderRecord>>(`/admin/orders/${orderId}/approve`),
  );
}

export function rejectOrder(orderId: string, reason?: string) {
  return unwrap(
    api.post<ApiEnvelope<OrderRecord>>(`/admin/orders/${orderId}/reject`, {
      reason,
    }),
  );
}

export function sendBalanceReminder(orderId: string) {
  return unwrap(
    api.post<ApiEnvelope<{ message: string }>>(
      `/admin/orders/${orderId}/balance-reminder`,
    ),
  );
}

export function getMyProfile() {
  return unwrap(api.get<ApiEnvelope<UserProfile>>("/user/me"));
}

export function updateMyProfile(input: Partial<UserProfile>) {
  return unwrap(api.patch<ApiEnvelope<UserProfile>>("/user/me", input));
}

export function getPricingPresets() {
  return unwrap(
    api.get<ApiEnvelope<PricingPreset[]>>("/admin/pricing-presets"),
  );
}

export function updatePricingPreset(key: string, value: number) {
  return unwrap(
    api.patch<ApiEnvelope<PricingPreset>>(`/admin/pricing-presets/${key}`, {
      value,
    }),
  );
}

export function getCarriers() {
  return unwrap(api.get<ApiEnvelope<Carrier[]>>("/admin/carriers"));
}

export function addCarrier(input: Carrier) {
  return unwrap(api.post<ApiEnvelope<Carrier>>("/admin/carriers", input));
}

export function removeCarrier(email: string) {
  return unwrap(
    api.delete<ApiEnvelope<{ message: string }>>(
      `/admin/carriers/${encodeURIComponent(email)}`,
    ),
  );
}

export function getContactInquiries(
  params: Pick<OrderQuery, "limit" | "page">,
) {
  return unwrap(
    api.get<ApiEnvelope<PaginatedResponse<ContactInquiry>>>("/contact/all", {
      params,
    }),
  );
}

export function removeContactInquiry(id: string) {
  return unwrap(api.delete<ApiEnvelope<{ message: string }>>(`/contact/${id}`));
}
