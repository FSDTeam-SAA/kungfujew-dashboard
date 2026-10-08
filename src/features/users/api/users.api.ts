import { z } from "zod";
import { api } from "@/lib/api";
import { accountSchema, type UserFormValues } from "../schema";

const accountsResponse = z.object({ data: z.array(accountSchema) });
const accountResponse = z.object({ data: accountSchema });

export async function listUsers() {
  const response = await api.get<unknown>("/user");
  return accountsResponse.parse(response.data).data;
}

export async function createUser(values: UserFormValues) {
  const response = await api.post<unknown>("/user", {
    fullName: values.fullName,
    email: values.email,
    phoneNumber: values.phoneNumber || undefined,
    role: values.role,
    status: values.status,
    password: values.password,
  });
  return accountResponse.parse(response.data).data;
}

export async function updateUser(id: string, values: UserFormValues) {
  const response = await api.patch<unknown>(`/user/${encodeURIComponent(id)}`, {
    fullName: values.fullName,
    email: values.email,
    phoneNumber: values.phoneNumber,
    role: values.role,
    status: values.status,
  });
  return accountResponse.parse(response.data).data;
}

export async function setUserPassword(id: string, password: string) {
  await api.patch(`/user/${encodeURIComponent(id)}/password`, { password });
}

export async function deactivateUser(id: string) {
  await api.delete(`/user/${encodeURIComponent(id)}`);
}
