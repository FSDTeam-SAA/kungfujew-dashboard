import { z } from "zod";

import { getApiBaseUrl } from "@/lib/api-url";

export interface RefreshedTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

const refreshedTokensSchema = z.object({
  data: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.number().positive(),
  }),
});

export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshedTokens> {
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : null;
    throw new Error(message || "Unable to refresh the session");
  }

  return refreshedTokensSchema.parse(payload).data;
}
