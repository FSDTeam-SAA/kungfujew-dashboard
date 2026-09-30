import { api } from "@/lib/api";
import type { ShipmentStory } from "../types";

interface ContentResponse {
  success: boolean;
  message?: string;
  data?: ShipmentStory[];
  pagination?: { total: number };
  url?: string;
}

// Retains the editor's response contract while using the shared auth/refresh client.
export async function contentRequest(path: string, options: RequestInit = {}) {
  const headers = Object.fromEntries(new Headers(options.headers).entries());
  const response = await api.request<ContentResponse>({
    url: path,
    method: options.method || "GET",
    headers,
    data: options.body,
  });
  return { ok: true, json: async () => response.data };
}
