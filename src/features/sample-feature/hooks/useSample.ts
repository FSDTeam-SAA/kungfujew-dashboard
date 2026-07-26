import { useQuery } from "@tanstack/react-query";
import { getSampleItems } from "../api/sample.api";

export function useSampleItems() {
  return useQuery({
    queryKey: ["sample-items"],
    queryFn: getSampleItems,
  });
}
