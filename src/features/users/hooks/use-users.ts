import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../api/users.api";
import type { UserFormValues } from "../schema";

const usersKey = ["users"] as const;

export function useUsers() {
  return useQuery({ queryKey: usersKey, queryFn: usersApi.listUsers });
}

export function useUserActions() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: usersKey });
  return {
    create: useMutation({
      mutationFn: usersApi.createUser,
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, values }: { id: string; values: UserFormValues }) =>
        usersApi.updateUser(id, values),
      onSuccess: refresh,
    }),
    password: useMutation({
      mutationFn: ({ id, password }: { id: string; password: string }) =>
        usersApi.setUserPassword(id, password),
      onSuccess: refresh,
    }),
    deactivate: useMutation({
      mutationFn: usersApi.deactivateUser,
      onSuccess: refresh,
    }),
  };
}
