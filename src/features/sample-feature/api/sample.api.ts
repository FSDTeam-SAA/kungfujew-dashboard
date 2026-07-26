import { api } from "@/lib/api";
import { SampleItem } from "../types";

// Example: GET all items
export async function getSampleItems(): Promise<SampleItem[]> {
  const res = await api.get("/sample");
  return res.data;
}
