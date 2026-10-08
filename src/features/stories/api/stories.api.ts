import { z } from "zod";
import { api } from "@/lib/api";
import { storyListSchema, storySchema, type StoryFormValues } from "../schema";

const storyResponseSchema = z.object({
  success: z.literal(true),
  data: storySchema,
});
const BASE = "/real-shipment-stories";

export interface StoryQuery {
  page: number;
  search?: string;
  isPublished?: "all" | "true" | "false";
}

export async function listStories(params: StoryQuery) {
  const response = await api.get<unknown>(BASE, {
    params: { ...params, limit: 10 },
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
  return form;
}

export async function saveStory(
  values: StoryFormValues,
  id?: string,
  image?: File | null,
) {
  const body = storyFormData(values, image);
  const response = id
    ? await api.put<unknown>(`${BASE}/${encodeURIComponent(id)}`, body)
    : await api.post<unknown>(BASE, body);
  return storyResponseSchema.parse(response.data).data;
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
