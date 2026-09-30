import { api } from "@/lib/api";

export interface Project {
  _id: string;
  name: string;
  type: "web" | "app";
  category?: string;
  profile?: string;
  figmaLink?: string;
  websiteLink?: string;
  adminLink?: string;
  createdAt: string;
}
interface ProjectListResponse {
  success: boolean;
  data: Project[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
const path = "/api/v1/projects";
export async function fetchProjects(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: string;
}) {
  return (await api.get<ProjectListResponse>(path, { params })).data;
}
export async function createProject(input: Omit<Project, "_id" | "createdAt">) {
  return (await api.post<{ data: Project }>(path, input)).data.data;
}
export async function updateProject(id: string, input: Partial<Project>) {
  return (await api.put<{ data: Project }>(`${path}/${id}`, input)).data.data;
}
export async function deleteProject(id: string) {
  await api.delete(`${path}/${id}`);
}
