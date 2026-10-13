import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StoryEditorSkeletonProps } from "../types";

/**
 * StoryEditorSkeleton
 *
 * Implements Antigravity Rule 3 (Skeleton Mirroring) and Rule 6 (Skeleton First).
 * Mirrors the exact layout, dimensions, and paddings of the 4-tab editorial workflow
 * in `StoryEditor` to eliminate Cumulative Layout Shift (CLS) during data fetching
 * and Partial Prerendering (PPR) transitions.
 */
export function StoryEditorSkeleton({ className }: StoryEditorSkeletonProps) {
  return (
    <section
      className={cn("space-y-5", className)}
      aria-busy="true"
      aria-label="Loading story editor"
      role="status"
    >
      <span className="sr-only">Loading shipment story editor…</span>

      {/* 1. Header Bar: Title, description, and action buttons */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dfe5ee] pb-5">
        <div className="space-y-2">
          {/* Eyebrow badge / label */}
          <Skeleton className="h-4 w-36" />
          {/* Main Title: font-serif text-3xl sm:text-4xl */}
          <Skeleton className="h-9 w-72 sm:h-10 sm:w-80" />
          {/* Editorial guidance paragraph */}
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Back button (ArrowLeft + Stories) */}
          <Skeleton className="h-10 w-28 rounded-md" />
          {/* Preview / Review story toggle */}
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>

      {/* 2. Status & Autosave Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Story status badge (Draft vs Published) */}
        <Skeleton className="h-7 w-24 rounded-full" />
        {/* Autosave / Local recovery status message */}
        <Skeleton className="h-4 w-48" />
      </div>

      {/* 3. 4-Tab Editorial Workflow Navigation List */}
      <div className="inline-flex h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border border-[#d7deea] bg-[#f1f5fa] p-1 sm:w-auto">
        {/* Tab 1: Narrative & Editor */}
        <Skeleton className="h-9 w-36 rounded-md sm:w-40" />
        {/* Tab 2: Shipment Details */}
        <Skeleton className="h-9 w-32 rounded-md sm:w-36" />
        {/* Tab 3: SEO & Social */}
        <Skeleton className="h-9 w-28 rounded-md sm:w-32" />
        {/* Tab 4: FAQs */}
        <Skeleton className="h-9 w-20 rounded-md sm:w-24" />
      </div>

      {/* 4. Editorial Content Canvas (Narrative Tab Primary Layout) */}
      <div className="space-y-5">
        {/* 4a. Title Card */}
        <div className="rounded-xl border border-[#d7deea] bg-white p-5 shadow-[0_12px_36px_rgba(1,32,85,0.04)] sm:p-7">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>

        {/* 4b. Cover Photo Uploader Card */}
        <div className="rounded-xl border border-[#d7deea] bg-white p-5 shadow-[0_12px_36px_rgba(1,32,85,0.04)] sm:p-7">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-72 max-w-full" />
          </div>

          {/* Cover Dropzone / File Picker Placeholder */}
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d7deea] bg-[#f8fafc] py-10">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="mt-3 h-4 w-48" />
            <Skeleton className="mt-1 h-3 w-32" />
          </div>

          {/* Cover Alt Text Input */}
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        {/* 4c. TipTap Rich Text Editor Container */}
        <div className="overflow-hidden rounded-xl border border-[#d7deea] bg-white shadow-[0_12px_36px_rgba(1,32,85,0.04)]">
          {/* Editor Grouped Toolbar Skeleton */}
          <div className="border-b border-[#e0e6ee] bg-[#f6f8fb] px-3 py-2 sm:px-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                {/* Group 1: History */}
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
                <span
                  aria-hidden="true"
                  className="mx-1 h-5 w-px bg-[#d7deea]"
                />

                {/* Group 2: Text Style */}
                <Skeleton className="h-9 w-28 rounded-md" />
                <span
                  aria-hidden="true"
                  className="mx-1 h-5 w-px bg-[#d7deea]"
                />

                {/* Group 3: Formatting (Bold, Italic, Underline, Strike) */}
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
                <span
                  aria-hidden="true"
                  className="mx-1 h-5 w-px bg-[#d7deea]"
                />

                {/* Group 4: Alignment & Lists */}
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
                <span
                  aria-hidden="true"
                  className="mx-1 h-5 w-px bg-[#d7deea]"
                />

                {/* Group 5: Media & Links */}
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
              </div>

              {/* Group 6: Fullscreen Toggle */}
              <Skeleton className="size-9 rounded-md" />
            </div>
          </div>

          {/* Editor Prose Canvas Placeholder */}
          <div className="min-h-[22rem] max-w-[70ch] mx-auto px-5 py-7 sm:px-9 sm:py-10 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <div className="pt-4 space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          {/* Live Metrics Footer Bar */}
          <div className="flex flex-wrap items-center justify-between border-t border-[#e0e6ee] bg-[#f8fafc] px-4 py-2">
            <Skeleton className="h-3.5 w-48" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Actions & Save Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe5ee] pt-5">
        <Skeleton className="h-4 w-80 max-w-full" />
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
    </section>
  );
}
