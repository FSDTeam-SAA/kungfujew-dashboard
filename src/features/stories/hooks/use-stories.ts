import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as storiesApi from "../api/stories.api";
import type { StoryFormValues } from "../schema";

export const storyKeys = {
  all: ["stories"] as const,
  list: (params: storiesApi.StoryQuery) => ["stories", "list", params] as const,
  detail: (id: string) => ["stories", "detail", id] as const,
};

export function useStories(params: storiesApi.StoryQuery) {
  return useQuery({
    queryKey: storyKeys.list(params),
    queryFn: () => storiesApi.listStories(params),
  });
}

export function useStory(id: string | null) {
  return useQuery({
    queryKey: storyKeys.detail(id ?? ""),
    queryFn: () => storiesApi.getStory(id!),
    enabled: Boolean(id),
  });
}

export function useStoryActions() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: storyKeys.all });
  return {
    save: useMutation({
      mutationFn: ({
        values,
        id,
        image,
      }: {
        values: StoryFormValues;
        id?: string;
        image?: File | null;
      }) => storiesApi.saveStory(values, id, image),
      onSuccess: refresh,
    }),
    publish: useMutation({
      mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
        storiesApi.setStoryPublished(id, isPublished),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: storiesApi.deleteStory,
      onSuccess: refresh,
    }),
  };
}
