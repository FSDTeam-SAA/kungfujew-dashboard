import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as dashboardApi from "../api/dashboard.api";
import type { ManualPaymentInput, OrderQuery } from "../types";

export const dashboardQueryKeys = {
  customers: (params: OrderQuery) =>
    ["dashboard", "customers", params] as const,
  customer: (email: string) => ["dashboard", "customer", email] as const,
  order: (orderId: string) => ["dashboard", "order", orderId] as const,
  orders: (params: OrderQuery) => ["dashboard", "orders", params] as const,
  payments: (params: OrderQuery) => ["dashboard", "payments", params] as const,
  profile: ["dashboard", "profile"] as const,
  summary: ["dashboard", "summary"] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardQueryKeys.summary,
    queryFn: dashboardApi.getDashboardSummary,
  });
}
export function useOrders(params: OrderQuery) {
  return useQuery({
    queryKey: dashboardQueryKeys.orders(params),
    queryFn: () => dashboardApi.getOrders(params),
  });
}
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: dashboardQueryKeys.order(orderId),
    queryFn: () => dashboardApi.getOrder(orderId),
    enabled: Boolean(orderId),
  });
}
export function useCustomers(params: OrderQuery) {
  return useQuery({
    queryKey: dashboardQueryKeys.customers(params),
    queryFn: () => dashboardApi.getCustomers(params),
  });
}
export function useCustomer(email: string) {
  return useQuery({
    queryKey: dashboardQueryKeys.customer(email),
    queryFn: () => dashboardApi.getCustomer(email),
    enabled: Boolean(email),
  });
}
export function usePayments(params: OrderQuery) {
  return useQuery({
    queryKey: dashboardQueryKeys.payments(params),
    queryFn: () => dashboardApi.getPayments(params),
  });
}
export function useMyProfile() {
  return useQuery({
    queryKey: dashboardQueryKeys.profile,
    queryFn: dashboardApi.getMyProfile,
  });
}

export function useOrderActions() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });

  return {
    approve: useMutation({
      mutationFn: dashboardApi.approveOrder,
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
        dashboardApi.rejectOrder(orderId, reason),
      onSuccess: invalidate,
    }),
    manualPayment: useMutation({
      mutationFn: ({
        orderId,
        input,
      }: {
        orderId: string;
        input: ManualPaymentInput;
      }) => dashboardApi.confirmManualPayment(orderId, input),
      onSuccess: invalidate,
    }),
    reminder: useMutation({
      mutationFn: dashboardApi.sendBalanceReminder,
      onSuccess: invalidate,
    }),
    review: useMutation({
      mutationFn: ({ orderId, notes }: { orderId: string; notes?: string }) =>
        dashboardApi.reviewOrder(orderId, notes),
      onSuccess: invalidate,
    }),
  };
}
