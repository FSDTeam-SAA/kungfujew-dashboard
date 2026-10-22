import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  getStoryAnalytics,
  listStoryAnalytics,
} from "../api/story-analytics.api";
import type { AnalyticsDays } from "../story-analytics.schema";

export const storyAnalyticsKeys = {
  all: ["stories", "analytics"] as const,
  batch: (ids: string[], days: AnalyticsDays) =>
    ["stories", "analytics", "batch", ids, days] as const,
  detail: (id: string, days: AnalyticsDays) =>
    ["stories", "analytics", "detail", id, days] as const,
};

function retryReadership(failureCount: number, error: Error) {
  if (
    axios.isAxiosError(error) &&
    [401, 403].includes(error.response?.status ?? 0)
  )
    return false;
  return failureCount < 1;
}

export function useStoryAnalyticsBatch(storyIds: string[], enabled = true) {
  const ids = [...new Set(storyIds)].sort();
  return useQuery({
    queryKey: storyAnalyticsKeys.batch(ids, 30),
    queryFn: ({ signal }) => listStoryAnalytics(ids, 30, signal),
    enabled: enabled && ids.length > 0,
    staleTime: 0,
    gcTime: 0,
    retry: retryReadership,
  });
}

export function useStoryAnalytics(
  storyId: string,
  days: AnalyticsDays,
  enabled: boolean,
) {
  return useQuery({
    queryKey: storyAnalyticsKeys.detail(storyId, days),
    queryFn: ({ signal }) => getStoryAnalytics(storyId, days, signal),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: retryReadership,
  });
}
