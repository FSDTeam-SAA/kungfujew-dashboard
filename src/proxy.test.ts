/** @jest-environment node */

import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));

const mockedGetToken = jest.mocked(getToken);
const tokenFor = (role: string): JWT => ({
  id: "test-user",
  name: "Test User",
  email: "test@example.com",
  image: "",
  role,
  accessToken: "access-token",
  refreshToken: "refresh-token",
  accessTokenExpires: Date.now() + 60_000,
});

describe("staff route protection", () => {
  beforeEach(() => mockedGetToken.mockReset());

  it.each([
    ["admin", "/dashboard/orders/123", null],
    ["admin", "/dashboard/stories", null],
    ["admin", "/dashboard/users", null],
    ["operations_manager", "/dashboard/orders/123", null],
    ["operations_manager", "/dashboard/stories", "/dashboard"],
    ["operations_manager", "/dashboard/users", "/dashboard"],
    ["story_manager", "/dashboard/stories", null],
    ["story_manager", "/dashboard/orders/123", "/dashboard/stories"],
    ["story_manager", "/dashboard/users", "/dashboard/stories"],
    ["customer", "/dashboard", "/?error=AccessDenied"],
    ["businessowner", "/dashboard", "/?error=AccessDenied"],
    ["unknown", "/dashboard", "/?error=AccessDenied"],
    ["operations_manager", "/dashboard/pricing", "/dashboard"],
  ])("handles %s opening %s", async (role, pathname, redirect) => {
    mockedGetToken.mockResolvedValue(tokenFor(role));
    const response = await proxy(
      new NextRequest(`https://dashboard.example${pathname}`),
    );
    expect(response.headers.get("location")).toBe(
      redirect ? `https://dashboard.example${redirect}` : null,
    );
  });

  it("returns guests to login with their original destination", async () => {
    mockedGetToken.mockResolvedValue(null);
    const response = await proxy(
      new NextRequest("https://dashboard.example/dashboard/stories"),
    );
    expect(response.headers.get("location")).toBe(
      "https://dashboard.example/?callbackUrl=%2Fdashboard%2Fstories",
    );
  });

  it("returns sessions with failed token refresh to login", async () => {
    mockedGetToken.mockResolvedValue({
      ...tokenFor("admin"),
      error: "RefreshAccessTokenError",
    });
    const response = await proxy(
      new NextRequest("https://dashboard.example/dashboard/users"),
    );
    expect(response.headers.get("location")).toBe(
      "https://dashboard.example/?callbackUrl=%2Fdashboard%2Fusers",
    );
  });
});
