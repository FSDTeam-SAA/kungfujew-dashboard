import { z } from "zod";
import {
  coverPositionSchema,
  centeredCover,
  shipmentStatuses,
  type StoryFormValues,
} from "./schema";

const draftValuesSchema: z.ZodType<StoryFormValues> = z.object({
  title: z.string(),
  slug: z.string(),
  metaDescription: z.string(),
  content: z.string(),
  pickupLocation: z.string(),
  destination: z.string(),
  shipmentType: z.string(),
  serviceLine: z.string(),
  shipmentStatus: z.enum(shipmentStatuses),
  coverPosition: coverPositionSchema.optional().default(centeredCover),
  imageAlt: z.string(),
  image: z.string().optional(),
  isPublished: z.boolean(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
});

const storyDraftSchema = z.object({
  version: z.literal(1),
  savedAt: z.string().datetime(),
  baseUpdatedAt: z.string().nullable(),
  hadCoverFile: z.boolean(),
  values: draftValuesSchema,
});

export type StoryLocalDraft = z.infer<typeof storyDraftSchema>;

export function draftKey(userId: string, storyId: string | null): string {
  return `story-draft:v1:${encodeURIComponent(userId)}:${encodeURIComponent(storyId ?? "new")}`;
}

export function readStoryDraft(key: string): StoryLocalDraft | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? storyDraftSchema.parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeStoryDraft(key: string, draft: StoryLocalDraft): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function removeStoryDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage may be unavailable; editing and server saves must still work.
  }
}

export function isStoryDraftStale(
  draft: StoryLocalDraft,
  serverUpdatedAt?: string,
): boolean {
  return Boolean(
    draft.baseUpdatedAt &&
    serverUpdatedAt &&
    draft.baseUpdatedAt !== serverUpdatedAt,
  );
}
