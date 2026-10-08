import { AxiosHeaders, type AxiosResponse } from "axios";

import { api } from "@/lib/api";

import { getPayments } from "./dashboard.api";
import type { ApiEnvelope, OrderRecord, PaginatedResponse } from "../types";

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

const paymentResponse = {
  data: {
    statusCode: 200,
    message: "Success",
    data: {
      items: [],
      meta: {
        limit: 20,
        page: 1,
        total: 0,
        totalPages: 0,
      },
    },
  },
  status: 200,
  statusText: "OK",
  headers: {},
  config: { headers: new AxiosHeaders() },
} satisfies AxiosResponse<ApiEnvelope<PaginatedResponse<OrderRecord>>>;

describe("getPayments", () => {
  beforeEach(() => {
    jest.mocked(api.get).mockResolvedValue(paymentResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("does not send balanceDue to the standard payments endpoint", async () => {
    await getPayments({ balanceDue: false, limit: 20, page: 1 });

    expect(api.get).toHaveBeenCalledWith("/admin/payments", {
      params: { limit: 20, page: 1 },
    });
  });

  it("uses the balance-due endpoint when requested", async () => {
    await getPayments({ balanceDue: true, limit: 20, page: 1, search: "CCG" });

    expect(api.get).toHaveBeenCalledWith("/admin/orders/balance-due", {
      params: { limit: 20, page: 1, search: "CCG" },
    });
  });
});
