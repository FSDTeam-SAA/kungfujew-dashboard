import { api } from "@/lib/api";
import {
  analyticsDaysSchema,
  analyticsStoryIdSchema,
  storyAnalyticsResponseSchema,
  type AnalyticsDays,
} from "../story-analytics.schema";

const BASE = "/real-shipment-stories";

function parseReport(
  response: unknown,
  storyIds: string[],
  days: AnalyticsDays,
) {
  const parsed = storyAnalyticsResponseSchema.safeParse(response);
  if (!parsed.success)
    throw new Error("Readership data is unavailable. Please try again.");
  const report = parsed.data.data;
  const ids = report.stories.map((story) => story.storyId);
  if (
    report.days !== days ||
    new Date(report.from) >= new Date(report.to) ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !storyIds.includes(id)) ||
    report.stories.some((story) => {
      const dates = story.daily.map((day) => day.date);
      return (
        new Set(dates).size !== dates.length ||
        dates.some(
          (date) =>
            date < report.from.slice(0, 10) || date > report.to.slice(0, 10),
        )
      );
    })
  )
    throw new Error("Readership data is unavailable. Please try again.");
  return report;
}

export async function listStoryAnalytics(
  storyIds: string[],
  days: AnalyticsDays = 30,
  signal?: AbortSignal,
) {
  analyticsDaysSchema.parse(days);
  if (!storyIds.length || storyIds.length > 50)
    throw new Error("Select between 1 and 50 stories.");
  storyIds.forEach((id) => analyticsStoryIdSchema.parse(id));
  const response = await api.get<unknown>(`${BASE}/analytics`, {
    params: { storyIds: [...new Set(storyIds)].join(","), days },
    signal,
  });
  return parseReport(response.data, storyIds, days);
}

export async function getStoryAnalytics(
  storyId: string,
  days: AnalyticsDays = 30,
  signal?: AbortSignal,
) {
  analyticsDaysSchema.parse(days);
  analyticsStoryIdSchema.parse(storyId);
  const response = await api.get<unknown>(
    `${BASE}/${encodeURIComponent(storyId)}/analytics`,
    {
      params: { days },
      signal,
    },
  );
  return parseReport(response.data, [storyId], days);
}
