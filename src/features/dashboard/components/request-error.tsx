"use client";

import axios from "axios";
import { Button } from "@/components/ui/button";

export function requestErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401)
      return "Your session has expired. Sign in again.";
    if (error.response?.status === 403)
      return "You do not have access to this action.";
    const data: unknown = error.response?.data;
    if (data && typeof data === "object" && "message" in data) {
      const message = data.message;
      if (typeof message === "string") return message;
      if (
        Array.isArray(message) &&
        message.every((item) => typeof item === "string")
      ) {
        return message.join(" ");
      }
    }
  }
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function RequestError({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <p>{requestErrorMessage(error)}</p>
      {retry && (
        <Button
          type="button"
          variant="outline"
          onClick={retry}
          className="mt-3"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
