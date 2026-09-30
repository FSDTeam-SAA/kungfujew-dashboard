"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signOut, useSession } from "next-auth/react";
import {
  getMyProfile,
  updateMyProfile,
} from "@/features/dashboard/api/dashboard.api";
import { changePassword } from "../api/settings.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name"),
  email: z.string().email("Enter a valid email"),
});
const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
const profileKey = ["account", "profile"] as const;

export default function SettingsView() {
  const { update } = useSession();
  const cache = useQueryClient();
  const profile = useQuery({ queryKey: profileKey, queryFn: getMyProfile });
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile.data?.fullName || "",
      email: profile.data?.email || "",
    },
  });
  const password = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });
  const save = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: async (data) => {
      cache.setQueryData(profileKey, data);
      await update({ user: { name: data.fullName, email: data.email } });
    },
  });
  const change = useMutation({
    mutationFn: changePassword,
    onSuccess: async () => {
      password.reset();
      // The backend revokes existing sessions after a password change.
      await signOut({ callbackUrl: "/" });
    },
  });
  if (profile.isPending) return <p role="status">Loading your profile...</p>;
  if (profile.isError)
    return (
      <div role="alert">
        Could not load your profile.{" "}
        <Button onClick={() => profile.refetch()}>Retry</Button>
      </div>
    );
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form
        className="space-y-5 rounded-xl border bg-white p-6"
        onSubmit={form.handleSubmit((values) =>
          save.mutate({ fullName: values.fullName }),
        )}
      >
        <h2 className="text-xl font-semibold">Profile</h2>
        <label className="block" htmlFor="profile-name">
          Full name
        </label>
        <Input
          id="profile-name"
          autoComplete="name"
          {...form.register("fullName")}
        />
        <p role="alert">{form.formState.errors.fullName?.message}</p>
        <label className="block" htmlFor="profile-email">
          Email
        </label>
        <Input
          id="profile-email"
          readOnly
          type="email"
          autoComplete="email"
          {...form.register("email")}
        />
        <p role="alert">{form.formState.errors.email?.message}</p>
        {save.isError && (
          <p role="alert">
            Unable to save your profile. Please check your details.
          </p>
        )}
        {save.isSuccess && <p role="status">Profile updated.</p>}
        <Button disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>
      <form
        className="space-y-5 rounded-xl border bg-white p-6"
        onSubmit={password.handleSubmit(({ oldPassword, newPassword }) =>
          change.mutate({ oldPassword, newPassword }),
        )}
      >
        <h2 className="text-xl font-semibold">Change password</h2>
        {(
          [
            ["oldPassword", "Current password"],
            ["newPassword", "New password"],
            ["confirmPassword", "Confirm new password"],
          ] as const
        ).map(([name, label]) => (
          <div className="space-y-2" key={name}>
            <label htmlFor={name}>{label}</label>
            <Input
              id={name}
              type="password"
              autoComplete={
                name === "oldPassword" ? "current-password" : "new-password"
              }
              {...password.register(name)}
            />
            <p role="alert">{password.formState.errors[name]?.message}</p>
          </div>
        ))}
        <p className="text-sm text-slate-600">
          Use at least 8 characters. Sign in again after changing your password.
        </p>
        {change.isError && (
          <p role="alert">
            Unable to change your password. Check your current password and try
            again.
          </p>
        )}
        <Button disabled={change.isPending}>
          {change.isPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
