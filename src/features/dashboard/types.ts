export type DashboardSection =
  "overview" | "orders" | "payments" | "customers" | "settings";

export interface ApiEnvelope<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface PageMeta {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PageMeta;
}

export interface OrderRecord {
  _id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupLocation: string;
  deliveryLocation: string;
  status: string;
  grandTotalPrice: number;
  subTotal: number;
  depositAmountCalculated: number;
  balanceAmountRemaining: number;
  isDepositPaid: boolean;
  isBalancePaid: boolean;
  paymentMethod?: string;
  paymentOption?: string;
  isReviewedByStaff: boolean;
  adminNotes?: string;
  deliveryAvailableDate?: string;
  inCarFreightWeight: number;
  pickupAvailableDate: string;
  transportType: string;
  timelineType: string;
  condition: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleType: string;
  vehicleYear: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  collectedDeposits: number;
  outstandingBalance: number;
  recentOrders: OrderRecord[];
  statusCounts: Array<{ count: number; status: string }>;
  totalOrders: number;
  totalQuotedValue: number;
}

export interface CustomerRecord {
  customerName: string;
  customerPhone: string;
  email: string;
  lastOrderAt: string;
  orderCount: number;
  outstandingBalance: number;
  totalOrderValue: number;
}

export interface CustomerDetails {
  customer: Pick<
    OrderRecord,
    "customerEmail" | "customerName" | "customerPhone"
  >;
  orders: OrderRecord[];
}

export interface UserProfile {
  avatar?: string;
  city?: string;
  country?: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  postalCode?: number;
  sector?: string;
}

export interface PricingPreset {
  category: string;
  description?: string;
  key: string;
  value: number;
}

export interface Carrier {
  companyName: string;
  email: string;
  phone?: string;
}

export interface ContactInquiry {
  _id: string;
  createdAt: string;
  email: string;
  message: string;
  name: string;
  phone?: string;
  subject?: string;
}

export interface OrderQuery {
  balanceDue?: boolean;
  limit?: number;
  page?: number;
  search?: string;
  status?: string;
}

export interface ManualPaymentInput {
  amountReceived: number;
  markBalancePaid?: boolean;
  paymentMethod: string;
  paymentOption: string;
  reference?: string;
}
