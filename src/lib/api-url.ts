const DEFAULT_API_URL = "http://localhost:5000/api/v1";

export function getApiBaseUrl(
  configuredUrl = process.env.NEXT_PUBLIC_API_URL,
): string {
  return (configuredUrl || DEFAULT_API_URL).replace(/\/+$/, "");
}
