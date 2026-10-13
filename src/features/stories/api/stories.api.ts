import { z } from "zod";
import { api } from "@/lib/api";
import { storyListSchema, storySchema, type StoryFormValues } from "../schema";

const storyResponseSchema = z.object({
  success: z.literal(true),
  data: storySchema,
});
const imageUploadResponseSchema = z.object({
  success: z.literal(true),
  url: z
    .string()
    .url()
    .refine((url) => new URL(url).protocol === "https:"),
});
const BASE = "/real-shipment-stories";

export interface StoryQuery {
  page: number;
  search?: string;
  isPublished?: "all" | "true" | "false";
  serviceLine?: string;
}

export async function listStories(params: StoryQuery) {
  const response = await api.get<unknown>(BASE, {
    params: { ...params, limit: 10, summary: true },
  });
  return storyListSchema.parse(response.data);
}

export async function getStory(id: string) {
  const response = await api.get<unknown>(`${BASE}/${encodeURIComponent(id)}`);
  return storyResponseSchema.parse(response.data).data;
}

function storyFormData(values: StoryFormValues, image?: File | null): FormData {
  const form = new FormData();
  for (const key of [
    "title",
    "slug",
    "metaDescription",
    "content",
    "pickupLocation",
    "destination",
    "shipmentType",
    "serviceLine",
    "shipmentStatus",
    "imageAlt",
  ] as const) {
    form.set(key, values[key]);
  }
  form.set("isPublished", String(values.isPublished));
  form.set("faqs", JSON.stringify(values.faqs));
  if (image) form.set("image", image);
  else if (values.image !== undefined) form.set("image", values.image);
  return form;
}

export async function saveStory(
  values: StoryFormValues,
  id?: string,
  image?: File | null,
  baseUpdatedAt?: string,
) {
  const body = storyFormData(values, image);
  if (id && baseUpdatedAt) body.set("baseUpdatedAt", baseUpdatedAt);
  const response = id
    ? await api.put<unknown>(`${BASE}/${encodeURIComponent(id)}`, body)
    : await api.post<unknown>(BASE, body);
  return storyResponseSchema.parse(response.data).data;
}

export async function uploadStoryImage(file: File): Promise<string> {
  const body = new FormData();
  body.set("image", file);
  const response = await api.post<unknown>(`${BASE}/upload-image`, body);
  return imageUploadResponseSchema.parse(response.data).url;
}

export async function setStoryPublished(id: string, isPublished: boolean) {
  const response = await api.patch<unknown>(
    `${BASE}/${encodeURIComponent(id)}/publish`,
    { isPublished },
  );
  return storyResponseSchema.parse(response.data).data;
}

export async function deleteStory(id: string) {
  await api.delete(`${BASE}/${encodeURIComponent(id)}`);
}
