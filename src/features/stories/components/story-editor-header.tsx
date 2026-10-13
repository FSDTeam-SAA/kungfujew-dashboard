"use client";

import { useWatch } from "react-hook-form";
import {
  ArrowLeft,
  Eye,
  PenLine,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CloudOff,
  Clock,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StoryEditorHeaderProps, StoryRecoveryStatus } from "../types";

export function StoryEditorHeader({
  control,
  isEditing,
  isPending,
  preview,
  onTogglePreview,
  onClose,
  recoveryStatus,
  formId,
  onSave,
  isDirty,
}: StoryEditorHeaderProps) {
  // Scoped leaf-level watches to avoid parent re-renders
  const isPublished = useWatch({ control, name: "isPublished" });
  const title = useWatch({ control, name: "title" });

  const saveLabel = isPublished
    ? isEditing
      ? "Save changes"
      : "Publish story"
    : "Save draft";

  return (
    <header className="sticky top-0 z-20 -mx-4 -mt-4 mb-6 border-b border-[#dfe5ee] bg-white/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:-mt-6 sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Back button, Title & Status Badges */}
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 gap-1.5 border-[#d7deea] bg-white text-xs font-medium text-[#1d2b4f] hover:bg-[#f1f5fa] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
            title="Return to stories overview"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Stories</span>
          </Button>

          <div className="hidden h-5 w-px bg-[#e0e6ee] sm:block dark:bg-slate-800" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-[#1d2b4f] sm:text-base dark:text-slate-100">
                {title?.trim()
                  ? title
                  : isEditing
                    ? "Edit shipment story"
                    : "Create shipment story"}
              </span>

              {/* Dynamic Story Status Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 text-[11px] font-medium transition-colors",
                  isPublished
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
                )}
              >
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>

            {/* Subtitle / Autosave Indicator on Mobile */}
            <div className="flex items-center gap-2 text-xs text-[#59677c] sm:hidden dark:text-slate-400">
              {renderRecoveryIndicator(recoveryStatus, isDirty)}
            </div>
          </div>
        </div>

        {/* Center/Desktop Status: Autosave & Recovery Pill */}
        <div className="hidden items-center gap-2 text-xs text-[#59677c] md:flex dark:text-slate-400">
          {renderRecoveryIndicator(recoveryStatus, isDirty)}
        </div>

        {/* Right Section: Preview toggle and Primary Save/Publish actions */}
        <div className="flex items-center gap-2">
          {/* Review / Continue Writing Preview Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTogglePreview}
            aria-pressed={preview}
            className="h-9 gap-1.5 border-[#012055] bg-white text-xs font-medium text-[#012055] hover:bg-[#eaf0f8] dark:border-blue-400 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800"
          >
            {preview ? (
              <PenLine className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
            <span>{preview ? "Continue writing" : "Review story"}</span>
          </Button>

          {/* Primary Save / Publish Button */}
          <Button
            type={formId ? "submit" : "button"}
            form={formId}
            onClick={onSave}
            disabled={isPending}
            className="min-h-9 min-w-[100px] gap-1.5 bg-[#012055] px-4 text-xs font-medium text-white hover:bg-[#1d2b4f] disabled:opacity-60 dark:bg-primary dark:text-primary-foreground"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" aria-hidden="true" />
                <span>{saveLabel}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Renders the localized autosave / draft recovery indicator with iconography and accessible semantics.
 */
function renderRecoveryIndicator(
  status: StoryRecoveryStatus,
  isDirty?: boolean,
) {
  switch (status) {
    case "ready":
    case "saved":
      return (
        <span
          role="status"
          className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          <span>Draft saved locally</span>
        </span>
      );
    case "stale":
      return (
        <span
          role="status"
          className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400"
        >
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          <span>Newer server version</span>
        </span>
      );
    case "pending":
      return (
        <span
          role="status"
          className="flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400"
        >
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          <span>Saving draft…</span>
        </span>
      );
    case "unavailable":
      return (
        <span
          role="status"
          className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"
        >
          <CloudOff className="size-3.5" aria-hidden="true" />
          <span>Local backup offline</span>
        </span>
      );
    case "idle":
    default:
      return (
        <span
          role="status"
          className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"
        >
          <Clock className="size-3.5" aria-hidden="true" />
          <span>{isDirty ? "Unsaved changes" : "All changes saved"}</span>
        </span>
      );
  }
}
