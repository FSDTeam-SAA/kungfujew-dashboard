import { api } from "@/lib/api";
export async function changePassword(input: {
  oldPassword: string;
  newPassword: string;
}) {
  await api.post("/auth/change-password", input);
}
