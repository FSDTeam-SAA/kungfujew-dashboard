import { useQuery } from "@tanstack/react-query";
import { contentRequest } from "../api/content.api";
import { fetchProjects } from "../api/projects.api";

export const contentKeys = {
  stories: (page: number) => ["content", "stories", page] as const,
  projects: (page: number, search: string, category: string) =>
    ["content", "projects", page, search, category] as const,
};
export function useStories(page: number, enabled: boolean) {
  return useQuery({
    queryKey: contentKeys.stories(page),
    enabled,
    queryFn: async () => {
      const response = await contentRequest(
        `/api/v1/real-shipment-stories?page=${page}&limit=5`,
      );
      return response.json();
    },
  });
}
export function useProjects(
  page: number,
  search: string,
  category: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: contentKeys.projects(page, search, category),
    enabled,
    queryFn: () => fetchProjects({ page, limit: 5, search, category }),
  });
}
