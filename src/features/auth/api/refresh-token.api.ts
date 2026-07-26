interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface RefreshedTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshedTokens> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const payload = (await response.json()) as ApiResponse<RefreshedTokens>;

  if (!response.ok) {
    throw new Error(payload.message || "Unable to refresh the session");
  }

  return payload.data;
}
