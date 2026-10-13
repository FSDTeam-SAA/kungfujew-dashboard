"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  FileText,
  ImageIcon,
  UploadCloud,
  X,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import type { NarrativeTabProps } from "../../types";
import { StoryRichTextEditor } from "../story-rich-text-editor";

const inputClass =
  "w-full bg-white text-sm border-[#d7deea] text-[#1d2b4f] focus-visible:border-[#012055] focus-visible:ring-[#012055]/20";

export function NarrativeTab({
  form,
  coverFile,
  onCoverChange,
  coverPreviewUrl,
  existingImageUrl,
  preview,
  coverNeedsReselection,
}: NarrativeTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const values = form.getValues();
  const displayImage = coverPreviewUrl || existingImageUrl || null;
  const imageAltText =
    values.imageAlt?.trim() || values.title?.trim() || "Shipment story cover";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onCoverChange(file);
  };

  const handleRemoveImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onCoverChange(null);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Preview Presentation Mode
  if (preview) {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-xl border border-[#d7deea] bg-white shadow-sm">
          {displayImage ? (
            <div className="relative aspect-[16/8] bg-[#e9edf3]">
              <Image
                src={displayImage}
                alt={imageAltText}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 900px"
              />
            </div>
          ) : (
            <div className="flex h-44 items-center justify-center gap-2 bg-[#e9edf3] text-sm text-[#59677c]">
              <ImageIcon className="size-5" aria-hidden="true" />
              No cover image selected
            </div>
          )}

          <div className="space-y-5 px-5 py-7 sm:px-9 sm:py-10">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#59677c]">
              <span>
                {values.serviceLine
                  ? values.serviceLine.replaceAll("-", " ")
                  : "Service line not set"}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {values.shipmentStatus
                  ? values.shipmentStatus.replaceAll("_", " ")
                  : "Status not set"}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-3xl leading-tight text-[#1d2b4f] sm:text-4xl">
                {values.title?.trim() || "Untitled shipment story"}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#4f5c70]">
                {values.metaDescription?.trim() ||
                  "No introduction has been written yet."}
              </p>
            </div>

            <div className="grid gap-3 border-t border-[#e0e6ee] pt-5 text-sm sm:grid-cols-3">
              <div>
                <span className="block text-xs uppercase tracking-wide text-[#59677c]">
                  From
                </span>
                <strong className="font-medium text-[#25324a]">
                  {values.pickupLocation || "Not set"}
                </strong>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wide text-[#59677c]">
                  To
                </span>
                <strong className="font-medium text-[#25324a]">
                  {values.destination || "Not set"}
                </strong>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wide text-[#59677c]">
                  Shipment
                </span>
                <strong className="font-medium text-[#25324a]">
                  {values.shipmentType || "Not set"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* TipTap Controlled Content in ReadOnly Preview Mode */}
        <FormField
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="sr-only">Story content</FormLabel>
              <FormControl>
                <StoryRichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  preview={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Common questions preview section if present */}
        {values.faqs && values.faqs.length > 0 && (
          <div className="rounded-xl border border-[#d7deea] bg-white p-5 sm:p-9 shadow-sm">
            <h3 className="font-serif text-2xl text-[#1d2b4f]">
              Common questions
            </h3>
            <dl className="mt-4 divide-y divide-[#e0e6ee]">
              {values.faqs.map((faq, index) => (
                <div key={index} className="py-4">
                  <dt className="font-semibold text-[#25324a]">
                    {faq.question || "Untitled question"}
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-[#59677c]">
                    {faq.answer || "No answer yet."}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    );
  }

  // Editorial Writing Mode
  return (
    <div className="space-y-6">
      {/* Title & Headline Card */}
      <div className="rounded-xl border border-[#d7deea] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#66748a]">
          <FileText className="size-4 text-[#012055]" aria-hidden="true" />
          <span>The narrative</span>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                htmlFor="title"
                className="text-sm font-semibold text-[#1d2b4f]"
              >
                Story title
              </FormLabel>
              <FormControl>
                <Input
                  id="title"
                  placeholder="A memorable title for this shipment"
                  {...field}
                  className="mt-2 h-12 border-[#d7deea] text-lg font-semibold text-[#1d2b4f] placeholder:text-[#59677c]/50 focus-visible:border-[#012055] focus-visible:ring-[#012055]/20 sm:text-xl"
                />
              </FormControl>
              <FormDescription className="text-xs text-[#59677c]">
                Craft an engaging title that highlights the vehicle, equipment,
                or logistics achievement.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Cover Image & Media Card */}
      <div className="space-y-5 rounded-xl border border-[#d7deea] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center justify-between border-b border-[#eef2f7] pb-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d2b4f]">
              <ImageIcon className="size-4 text-[#012055]" aria-hidden="true" />
              Cover Image
            </h3>
            <p className="mt-0.5 text-xs text-[#59677c]">
              Upload a high-resolution photo representing this shipment story.
            </p>
          </div>
          {displayImage && (
            <Badge
              variant="outline"
              className={
                coverFile
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-[#b6c7dd] bg-[#f1f5fa] text-[#1d2b4f]"
              }
            >
              {coverFile ? "New file ready" : "Saved cover"}
            </Badge>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          id="story-image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={handleFileSelect}
          className="sr-only"
        />

        {displayImage ? (
          <div className="space-y-4">
            <div className="relative aspect-[16/8] overflow-hidden rounded-lg border border-[#d7deea] bg-[#e9edf3] shadow-inner">
              <Image
                src={displayImage}
                alt={imageAltText}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 900px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleTriggerUpload}
                  className="bg-white/90 text-xs font-medium text-[#1d2b4f] shadow-sm backdrop-blur hover:bg-white"
                >
                  <RefreshCw className="mr-1.5 size-3.5" aria-hidden="true" />
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveImage}
                  className="bg-red-600/90 text-xs font-medium text-white shadow-sm backdrop-blur hover:bg-red-700"
                >
                  <X className="mr-1.5 size-3.5" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </div>

            {coverFile && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-700">
                <Sparkles className="size-3.5" aria-hidden="true" />
                <span>
                  Selected: <strong>{coverFile.name}</strong> (
                  {(coverFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </p>
            )}
          </div>
        ) : (
          <div
            onClick={handleTriggerUpload}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleTriggerUpload();
              }
            }}
            role="button"
            tabIndex={0}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] px-6 py-8 text-center transition-colors hover:border-[#012055] hover:bg-[#f1f5fa] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#012055]"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-white shadow-xs">
              <UploadCloud
                className="size-6 text-[#012055]"
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-[#1d2b4f]">
              Click to upload cover photo
            </p>
            <p className="mt-1 text-xs text-[#59677c]">
              JPEG, PNG, WebP, GIF or AVIF up to 10 MiB
            </p>
          </div>
        )}

        {/* Re-selection Callout if Draft was Restored without File */}
        {coverNeedsReselection && !coverFile && (
          <p
            role="status"
            className="flex items-center gap-1.5 text-xs font-medium text-amber-800"
          >
            <AlertCircle className="size-3.5" aria-hidden="true" />
            <span>Re-select the cover image from the restored draft.</span>
          </p>
        )}

        {/* Cover Image Alt Text */}
        <FormField
          control={form.control}
          name="imageAlt"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                htmlFor="imageAlt"
                className="text-xs font-medium text-[#1d2b4f]"
              >
                Image alt text
              </FormLabel>
              <FormControl>
                <Input
                  id="imageAlt"
                  placeholder="e.g. Classic 1968 Mustang loaded securely on carrier trailer"
                  {...field}
                  className={inputClass}
                />
              </FormControl>
              <FormDescription className="text-xs text-[#59677c]">
                Describe what is depicted in the cover photo for accessibility
                and SEO image search.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* TipTap Rich Text Editor Card */}
      <div className="space-y-3">
        <FormField
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="sr-only">Story content</FormLabel>
              <FormControl>
                <StoryRichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  preview={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
