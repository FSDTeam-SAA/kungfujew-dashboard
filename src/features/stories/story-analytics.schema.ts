import { z } from "zod";

export const analyticsDaysSchema = z.union([
  z.literal(7),
  z.literal(30),
  z.literal(90),
]);
export type AnalyticsDays = z.infer<typeof analyticsDaysSchema>;
export const analyticsStoryIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

const countsSchema = z.object({
  opens: z.number().int().nonnegative(),
  engaged: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
});
const validCounts = (counts: z.infer<typeof countsSchema>) =>
  counts.completed <= counts.engaged && counts.engaged <= counts.opens;

export const storyAnalyticsSchema = countsSchema
  .extend({
    storyId: analyticsStoryIdSchema,
    daily: z
      .array(
        countsSchema
          .extend({
            date: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/)
              .refine((date) => {
                const parsed = new Date(`${date}T00:00:00.000Z`);
                return (
                  Number.isFinite(parsed.getTime()) &&
                  parsed.toISOString().startsWith(date)
                );
              }),
          })
          .refine(validCounts),
      )
      .max(90),
  })
  .refine(validCounts);

export const storyAnalyticsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    days: analyticsDaysSchema,
    from: z.string().datetime(),
    to: z.string().datetime(),
    trackingStartedAt: z.string().datetime().nullable(),
    stories: z.array(storyAnalyticsSchema).max(50),
  }),
});

export type StoryAnalytics = z.infer<typeof storyAnalyticsSchema>;
export type StoryAnalyticsReport = z.infer<
  typeof storyAnalyticsResponseSchema
>["data"];
