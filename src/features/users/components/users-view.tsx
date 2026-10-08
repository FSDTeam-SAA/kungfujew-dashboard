"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signOut, useSession } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isStaffRole, staffRoles } from "@/lib/access";
import {
  RequestError,
  requestErrorMessage,
} from "@/features/dashboard/components/request-error";
import { useUserActions, useUsers } from "../hooks/use-users";
import {
  accountStatuses,
  userFormSchema,
  validStaffPassword,
  type StaffAccount,
  type UserFormValues,
} from "../schema";

const labelClass = "block text-sm font-medium text-[#1d2b4f]";
const fieldClass = "mt-1 w-full";
const passwordHelp =
  "Use at least 8 characters, including a lowercase letter, number, and symbol.";

function AccountEditor({
  account,
  onClose,
  onSaved,
}: {
  account?: StaffAccount;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { data: session } = useSession();
  const actions = useUserActions();
  const [error, setError] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: account?.fullName ?? "",
      email: account?.email ?? "",
      phoneNumber: account?.phoneNumber ?? "",
      role: account?.role,
      status: account?.status ?? "ACTIVE",
      password: "",
    },
  });
  const { errors } = form.formState;
  const selectedRole = useWatch({ control: form.control, name: "role" });
  const isSelf = account?._id === session?.user?.id;

  const submit = form.handleSubmit(async (values) => {
    setError("");
    if (!account && !validStaffPassword(values.password)) {
      form.setError("password", { message: passwordHelp });
      return;
    }
    if (
      account &&
      (values.role !== account.role || values.status !== account.status)
    ) {
      if (
        !window.confirm(
          `Change ${account.fullName}'s role or status? Their active sessions will be ended.`,
        )
      )
        return;
    }
    try {
      if (account) {
        await actions.update.mutateAsync({ id: account._id, values });
        if (
          isSelf &&
          (values.role !== account.role || values.status !== account.status)
        ) {
          await signOut({ callbackUrl: "/" });
          return;
        }
        onSaved("Account updated.");
      } else {
        await actions.create.mutateAsync(values);
        onSaved("Account created.");
      }
    } catch (cause) {
      setError(requestErrorMessage(cause));
    }
  });

  const setPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!account) return;
    setError("");
    if (!validStaffPassword(resetPassword)) {
      setError(passwordHelp);
      return;
    }
    if (
      !window.confirm(
        `Reset ${account.fullName}'s password and end active sessions?`,
      )
    )
      return;
    try {
      await actions.password.mutateAsync({
        id: account._id,
        password: resetPassword,
      });
      setResetPassword("");
      setShowReset(false);
      if (isSelf) {
        await signOut({ callbackUrl: "/" });
        return;
      }
      onSaved("Password updated and active sessions ended.");
    } catch (cause) {
      setError(requestErrorMessage(cause));
    }
  };

  const deactivate = async () => {
    if (
      !account ||
      !window.confirm(
        `Deactivate ${account.fullName}? Their account access will be removed.`,
      )
    )
      return;
    setError("");
    try {
      await actions.deactivate.mutateAsync(account._id);
      if (isSelf) {
        await signOut({ callbackUrl: "/" });
        return;
      }
      onSaved("Account deactivated.");
    } catch (cause) {
      setError(requestErrorMessage(cause));
    }
  };

  return (
    <section
      className="rounded-xl border bg-white p-4 shadow-sm sm:p-6"
      aria-labelledby="account-editor-title"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="account-editor-title"
            className="text-xl font-semibold text-[#1d2b4f]"
          >
            {account ? "Edit staff account" : "Create staff account"}
          </h2>
          {account && (
            <p className="text-sm text-[#535d70]">
              Role and status changes end active sessions.
            </p>
          )}
        </div>
        <Button type="button" variant="outline" onClick={onClose}>
          Back to staff accounts
        </Button>
      </div>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            name="fullName"
            label="Full name"
            error={errors.fullName?.message}
          >
            <Input
              id="fullName"
              {...form.register("fullName")}
              className={fieldClass}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              autoComplete="name"
            />
          </Field>
          <Field name="email" label="Email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              className={fieldClass}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="email"
            />
          </Field>
          <Field
            name="phoneNumber"
            label="Phone number"
            error={errors.phoneNumber?.message}
          >
            <Input
              id="phoneNumber"
              {...form.register("phoneNumber")}
              className={fieldClass}
              autoComplete="tel"
            />
          </Field>
          <Field name="role" label="Role" error={errors.role?.message}>
            <select
              id="role"
              {...form.register("role")}
              value={selectedRole ?? ""}
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? "role-error" : undefined}
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm"
              required
            >
              <option value="" disabled>
                Select a staff role
              </option>
              {staffRoles.map((role) => (
                <option key={role} value={role}>
                  {role.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field name="status" label="Status" error={errors.status?.message}>
            <select
              id="status"
              {...form.register("status")}
              aria-invalid={Boolean(errors.status)}
              aria-describedby={errors.status ? "status-error" : undefined}
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm"
            >
              {accountStatuses
                .filter((status) => status !== "DELETED")
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </Field>
          {!account && (
            <Field
              name="password"
              label="Initial password"
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className={fieldClass}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password
                    ? "password-error password-help"
                    : "password-help"
                }
                autoComplete="new-password"
              />
              <p id="password-help" className="mt-1 text-xs text-[#535d70]">
                {passwordHelp}
              </p>
            </Field>
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={actions.create.isPending || actions.update.isPending}
        >
          {account ? "Save account" : "Create staff account"}
        </Button>
      </form>
      {account && account.status !== "DELETED" && (
        <div className="mt-8 border-t pt-6">
          <h3 className="font-semibold text-[#1d2b4f]">Security actions</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReset((value) => !value)}
            >
              {showReset ? "Cancel password reset" : "Set password"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void deactivate()}
              disabled={actions.deactivate.isPending}
              className="text-red-700"
            >
              Deactivate account
            </Button>
          </div>
          {showReset && (
            <form onSubmit={setPassword} className="mt-4 max-w-md space-y-3">
              <label htmlFor="reset-password" className={labelClass}>
                New password
              </label>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-[#535d70]">{passwordHelp}</p>
              <Button type="submit" disabled={actions.password.isPending}>
                Update password
              </Button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

function Field({
  name,
  label,
  error,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="mt-1 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function UsersView() {
  const query = useUsers();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StaffAccount | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const users =
    query.data?.filter(
      (user): user is StaffAccount =>
        isStaffRole(user.role) &&
        `${user.fullName} ${user.email} ${user.role}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ) ?? [];

  if (editing)
    return (
      <AccountEditor
        key={editing === "new" ? "new" : editing._id}
        account={editing === "new" ? undefined : editing}
        onClose={() => setEditing(null)}
        onSaved={(message) => {
          setNotice(message);
          setEditing(null);
        }}
      />
    );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1d2b4f]">
            Staff accounts
          </h2>
          <p className="text-sm text-[#535d70]">
            Manage dashboard access for admin, operations, and story staff.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>Create staff account</Button>
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-md bg-green-50 p-3 text-sm text-green-800"
        >
          {notice}
        </p>
      )}
      <label htmlFor="user-search" className="sr-only">
        Search staff accounts
      </label>
      <Input
        id="user-search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search name, email, or role"
        className="max-w-md bg-white"
      />
      {query.isPending && <p role="status">Loading staff accounts…</p>}
      {query.error && (
        <RequestError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data &&
        (users.length === 0 ? (
          <p className="rounded-xl border bg-white p-8 text-center text-[#535d70]">
            No staff accounts found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-[#f2f5fa] text-[#1d2b4f]">
                <tr>
                  <th scope="col" className="p-4">
                    Account
                  </th>
                  <th scope="col" className="p-4">
                    Role
                  </th>
                  <th scope="col" className="p-4">
                    Status
                  </th>
                  <th scope="col" className="p-4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t">
                    <td className="p-4">
                      <span className="block font-medium text-[#1d2b4f]">
                        {user.fullName}
                      </span>
                      <span className="text-[#535d70]">{user.email}</span>
                    </td>
                    <td className="p-4">{user.role.replaceAll("_", " ")}</td>
                    <td className="p-4">{user.status}</td>
                    <td className="p-4">
                      {user.status === "DELETED" ? (
                        <span className="text-[#535d70]">Deleted</span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(user)}
                        >
                          Manage
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}
