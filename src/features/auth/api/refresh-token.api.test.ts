import { refreshAccessToken } from "./refresh-token.api";

describe("refreshAccessToken", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:5051";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  });

  it("calls the documented refresh-token endpoint and returns rotated tokens", async () => {
    const fetchSpy = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        statusCode: 200,
        message: "Success",
        data: {
          accessToken: "new-access-token",
          expiresIn: 900,
          refreshToken: "new-refresh-token",
        },
      }),
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await expect(refreshAccessToken("old-refresh-token")).resolves.toEqual({
      accessToken: "new-access-token",
      expiresIn: 900,
      refreshToken: "new-refresh-token",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:5051/auth/refresh-token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "old-refresh-token" }),
      }),
    );
  });
});
