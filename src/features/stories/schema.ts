import { z } from "zod";

export const serviceLines = ["vehicle", "freight", "heavy-equipment"] as const;
export const shipmentStatuses = [
  "pending",
  "in_transit",
  "delivered",
  "cancelled",
] as const;

export const storyFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().min(1, "Slug is required"),
  metaDescription: z.string().trim().min(1, "Meta description is required"),
  content: z.string().trim().min(1, "Content is required"),
  pickupLocation: z.string().trim().min(1, "Pickup location is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  shipmentType: z.string().trim().min(1, "Shipment type is required"),
  serviceLine: z
    .string()
    .refine(
      (value) => serviceLines.some((line) => line === value),
      "Select a service line",
    ),
  shipmentStatus: z.enum(shipmentStatuses),
  imageAlt: z.string(),
  isPublished: z.boolean(),
  faqs: z.array(
    z.object({
      question: z.string().trim().min(1, "Question is required"),
      answer: z.string().trim().min(1, "Answer is required"),
    }),
  ),
});

export type StoryFormValues = z.infer<typeof storyFormSchema>;

export const storySchema = storyFormSchema.extend({
  _id: z.string(),
  serviceLine: z.enum(serviceLines).optional(),
  image: z.string().optional().nullable(),
  imageAlt: z.string().optional().default(""),
  faqs: storyFormSchema.shape.faqs.optional().default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Story = z.infer<typeof storySchema>;

export const storyListSchema = z.object({
  success: z.literal(true),
  data: z.array(storySchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type StoryList = z.infer<typeof storyListSchema>;
