import { z } from "zod";

export const serviceLines = ["vehicle", "freight", "heavy-equipment"] as const;
export const shipmentStatuses = [
  "pending",
  "in_transit",
  "delivered",
  "cancelled",
] as const;

export function normalizeStorySlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const coverPositionSchema = z.object({
  x: z.number().finite().min(0).max(100),
  y: z.number().finite().min(0).max(100),
});
export type CoverPosition = z.infer<typeof coverPositionSchema>;
export const centeredCover: CoverPosition = { x: 50, y: 50 };

export const storyFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .string()
    .transform(normalizeStorySlug)
    .pipe(
      z
        .string()
        .max(200)
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Use letters, numbers and single hyphens",
        ),
    ),
  metaDescription: z
    .string()
    .trim()
    .min(1, "Meta description is required")
    .max(500),
  content: z
    .string()
    .trim()
    .max(500000)
    .refine(
      (html) =>
        Boolean(
          html
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;|&#0*160;|&#x0*a0;/gi, " ")
            .trim(),
        ),
      "Add text to the story body",
    ),
  pickupLocation: z
    .string()
    .trim()
    .min(1, "Pickup location is required")
    .max(200),
  destination: z.string().trim().min(1, "Destination is required").max(200),
  shipmentType: z.string().trim().min(1, "Shipment type is required").max(200),
  serviceLine: z
    .string()
    .refine(
      (value) => serviceLines.some((line) => line === value),
      "Select a service line",
    ),
  shipmentStatus: z.enum(shipmentStatuses),
  image: z.string().max(2048).optional(),
  coverPosition: coverPositionSchema.optional(),
  imageAlt: z.string().max(500),
  isPublished: z.boolean(),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(1, "Question is required").max(300),
        answer: z.string().trim().min(1, "Answer is required").max(10000),
      }),
    )
    .max(20, "A story can contain up to 20 FAQs"),
});

export type StoryFormValues = z.infer<typeof storyFormSchema>;

// Read legacy drafts without applying the stricter rules for new writes.
export const storySchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.string(),
  metaDescription: z.string(),
  content: z.string(),
  pickupLocation: z.string(),
  destination: z.string(),
  shipmentType: z.string(),
  shipmentStatus: z.enum(shipmentStatuses),
  isPublished: z.boolean(),
  serviceLine: z
    .string()
    .nullish()
    .transform((value) => value ?? undefined),
  image: z.string().optional().nullable(),
  coverPosition: coverPositionSchema.optional(),
  imageAlt: z.string().optional().default(""),
  faqs: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .nullish()
    .transform((value) => value ?? []),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Story = z.infer<typeof storySchema>;
export const storySummarySchema = storySchema.omit({
  content: true,
  faqs: true,
});
export type StorySummary = z.infer<typeof storySummarySchema>;

export const storyListSchema = z.object({
  success: z.literal(true),
  data: z.array(storySummarySchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type StoryList = z.infer<typeof storyListSchema>;
