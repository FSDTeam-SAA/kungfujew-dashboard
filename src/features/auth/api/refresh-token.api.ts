// src/features/auth/api/refresh-token.api.ts
import { api } from "@/lib/api";

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const response = await api.post("/auth/refresh-access-token", {
      refreshToken,
    });
    return response.data;
  } catch (error) {
    console.error("Refresh token error:", error);
    throw error;
  }
};
