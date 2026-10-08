import { getApiBaseUrl } from "./api-url";

describe("getApiBaseUrl", () => {
  it("preserves the backend API prefix", () => {
    expect(getApiBaseUrl("http://localhost:5010/api/v1")).toBe(
      "http://localhost:5010/api/v1",
    );
  });

  it("removes trailing slashes without removing the API prefix", () => {
    expect(getApiBaseUrl("http://localhost:5010/api/v1///")).toBe(
      "http://localhost:5010/api/v1",
    );
  });

  it("uses a prefixed local fallback", () => {
    expect(getApiBaseUrl("")).toBe("http://localhost:5000/api/v1");
  });
});
