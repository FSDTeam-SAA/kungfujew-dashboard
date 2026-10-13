"use client";

import * as React from "react";
import Image from "next/image";
import { useWatch } from "react-hook-form";
import {
  Wand2,
  Globe,
  Search,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ImageIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { normalizeStorySlug } from "../../schema";
import type { SeoSocialTabProps } from "../../types";

export { normalizeStorySlug as generateSlug } from "../../schema";

export function SeoSocialTab({ form, coverPreviewUrl }: SeoSocialTabProps) {
  const [previewTab, setPreviewTab] = React.useState<"serp" | "social">("serp");

  // Scoped leaf-level watches to eliminate root re-renders
  const metaDescription =
    useWatch({ control: form.control, name: "metaDescription" }) ?? "";
  const title = useWatch({ control: form.control, name: "title" }) ?? "";
  const slug = useWatch({ control: form.control, name: "slug" }) ?? "";

  const charCount = metaDescription.length;
  const isOptimalLength = charCount >= 150 && charCount <= 160;
  const isTooShort = charCount > 0 && charCount < 150;
  const isTooLong = charCount > 160;

  const handleGenerateSlug = () => {
    const currentTitle = form.getValues("title");
    if (!currentTitle?.trim()) {
      form.setError("slug", {
        type: "manual",
        message: "Enter a story title first to generate a slug",
      });
      return;
    }

    const cleanSlug = normalizeStorySlug(currentTitle);
    form.setValue("slug", cleanSlug, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
    form.clearErrors("slug");
  };

  const destinationUrl = `https://kungfujew.com/stories/${slug || "story-slug"}`;

  return (
    <div className="space-y-6">
      {/* SEO Configuration Card */}
      <Card className="border-[#d7deea] bg-white shadow-sm dark:border-slate-800 dark:bg-card">
        <CardHeader className="border-b border-[#e0e6ee] pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Globe
              className="size-4 text-[#012055] dark:text-blue-400"
              aria-hidden="true"
            />
            <CardTitle className="text-lg font-semibold text-[#1d2b4f] dark:text-slate-100">
              Search Engine Optimization (SEO)
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-[#59677c] dark:text-slate-400">
            Customize the URL slug and search snippet to maximize organic search
            discovery for this shipment.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {/* Slug input with 1-click auto-generate */}
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FormLabel
                    htmlFor="slug"
                    className="text-sm font-medium text-[#1d2b4f] dark:text-slate-200"
                  >
                    URL Slug
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSlug}
                    className="h-8 gap-1.5 border-[#b6c7dd] text-xs font-medium text-[#012055] hover:bg-[#eaf0f8] dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800"
                    title="Convert story title into URL slug"
                  >
                    <Wand2 className="size-3.5" aria-hidden="true" />
                    <span>Generate slug</span>
                  </Button>
                </div>

                <FormControl>
                  <div className="flex rounded-md shadow-xs">
                    <span className="hidden select-none items-center rounded-l-md border border-r-0 border-[#d7deea] bg-[#f1f5fa] px-3 text-xs text-[#59677c] sm:inline-flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                      kungfujew.com/stories/
                    </span>
                    <Input
                      id="slug"
                      {...field}
                      onChange={(event) =>
                        field.onChange(normalizeStorySlug(event.target.value))
                      }
                      placeholder="e.g. coast-to-coast-classic-car-haul"
                      className={cn(
                        "bg-white sm:rounded-l-none text-sm dark:bg-slate-950",
                        "focus-visible:border-[#012055] focus-visible:ring-[#012055]/20 dark:focus-visible:border-blue-500",
                      )}
                      aria-invalid={Boolean(form.formState.errors.slug)}
                    />
                  </div>
                </FormControl>

                <FormDescription className="text-xs text-[#59677c] dark:text-slate-400">
                  Spaces and punctuation become hyphens automatically. The path
                  uses lowercase letters, numbers, and hyphens only.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Meta description with live character counter & visual guide */}
          <FormField
            control={form.control}
            name="metaDescription"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FormLabel
                    htmlFor="metaDescription"
                    className="text-sm font-medium text-[#1d2b4f] dark:text-slate-200"
                  >
                    Meta Description
                  </FormLabel>

                  {/* Live Character Counter Badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-xs font-medium transition-colors",
                      charCount === 0 &&
                        "border-[#d7deea] bg-[#f8fafc] text-[#59677c] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
                      isOptimalLength &&
                        "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
                      isTooShort &&
                        "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
                      isTooLong &&
                        "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
                    )}
                  >
                    {charCount} / 160 characters
                  </Badge>
                </div>

                <FormControl>
                  <Textarea
                    id="metaDescription"
                    {...field}
                    rows={4}
                    placeholder="Summarize the shipment route, equipment used, challenges overcome, and key takeaways (150–160 characters optimal)..."
                    className={cn(
                      "bg-white text-sm dark:bg-slate-950",
                      "focus-visible:border-[#012055] focus-visible:ring-[#012055]/20 dark:focus-visible:border-blue-500",
                      isOptimalLength &&
                        "border-emerald-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-500/20",
                      isTooLong &&
                        "border-rose-300 focus-visible:border-rose-500 focus-visible:ring-rose-500/20",
                    )}
                    aria-invalid={Boolean(
                      form.formState.errors.metaDescription,
                    )}
                  />
                </FormControl>

                {/* Visual Guide & Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e9edf3] dark:bg-slate-800">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        charCount < 150 && "bg-amber-400",
                        isOptimalLength && "bg-emerald-500",
                        charCount > 160 && "bg-rose-500",
                      )}
                      style={{
                        width: `${Math.min(100, Math.round((charCount / 160) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    {charCount === 0 && (
                      <p className="flex items-center gap-1 text-[#59677c] dark:text-slate-400">
                        <Info className="size-3.5" aria-hidden="true" />
                        <span>
                          Recommended: 150–160 characters for search engine
                          snippets.
                        </span>
                      </p>
                    )}
                    {isTooShort && (
                      <p className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                        <AlertTriangle
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        <span>
                          {150 - charCount} more characters recommended for
                          ideal Google SERP display.
                        </span>
                      </p>
                    )}
                    {isOptimalLength && (
                      <p className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        <span>
                          Optimal length! Fits search snippet guidelines without
                          truncation.
                        </span>
                      </p>
                    )}
                    {isTooLong && (
                      <p className="flex items-center gap-1 text-rose-700 dark:text-rose-400">
                        <AlertTriangle
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        <span>
                          {charCount - 160} characters over 160. Google may
                          truncate text with an ellipsis (…).
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Live SERP & Social Preview Card */}
      <Card className="border-[#d7deea] bg-white shadow-sm dark:border-slate-800 dark:bg-card">
        <CardHeader className="border-b border-[#e0e6ee] pb-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Search
                className="size-4 text-[#012055] dark:text-blue-400"
                aria-hidden="true"
              />
              <CardTitle className="text-lg font-semibold text-[#1d2b4f] dark:text-slate-100">
                Search & Social Snippet Preview
              </CardTitle>
            </div>

            {/* View switcher: Google SERP vs Social Card */}
            <div className="inline-flex rounded-lg border border-[#d7deea] bg-[#f8fafc] p-0.5 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setPreviewTab("serp")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer",
                  previewTab === "serp"
                    ? "bg-white text-[#012055] shadow-xs dark:bg-slate-800 dark:text-blue-300"
                    : "text-[#59677c] hover:text-[#1d2b4f] dark:text-slate-400",
                )}
                aria-pressed={previewTab === "serp"}
              >
                <Search className="size-3" aria-hidden="true" />
                Google SERP
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("social")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer",
                  previewTab === "social"
                    ? "bg-white text-[#012055] shadow-xs dark:bg-slate-800 dark:text-blue-300"
                    : "text-[#59677c] hover:text-[#1d2b4f] dark:text-slate-400",
                )}
                aria-pressed={previewTab === "social"}
              >
                <Share2 className="size-3" aria-hidden="true" />
                Social Card
              </button>
            </div>
          </div>
          <CardDescription className="text-xs text-[#59677c] dark:text-slate-400">
            Live simulation of how potential clients see your story in search
            engines and social feeds.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5">
          {previewTab === "serp" ? (
            /* Google SERP Snippet Preview */
            <div className="rounded-xl border border-[#dfe5ee] bg-[#fbfcfd] p-5 dark:border-slate-800 dark:bg-slate-950">
              <p className="mb-3 text-[11px] font-semibold tracking-wider text-[#66748a] uppercase dark:text-slate-400">
                Google Search Snippet (Desktop / Mobile)
              </p>

              <div className="grid gap-4 sm:grid-cols-[1fr_96px]">
                <div className="min-w-0 space-y-1.5">
                  {/* Google URL / Breadcrumb */}
                  <div className="flex items-center gap-1.5 text-xs text-[#202124] dark:text-[#bdc1c6]">
                    <div className="flex size-4.5 items-center justify-center rounded-full bg-[#012055] text-[10px] font-bold text-white">
                      K
                    </div>
                    <div className="flex items-center gap-1 truncate text-xs text-[#4d5156] dark:text-slate-400">
                      <span className="font-medium text-[#202124] dark:text-slate-200">
                        Kungfu Jew Logistics
                      </span>
                      <span aria-hidden="true">›</span>
                      <span className="truncate">
                        stories › {slug || "story-slug"}
                      </span>
                    </div>
                  </div>

                  {/* Google Title Link */}
                  <h4 className="cursor-pointer truncate font-sans text-lg font-normal text-[#1a0dab] hover:underline sm:text-xl dark:text-[#8ab4f8]">
                    {title.trim()
                      ? `${title} | Kungfu Jew Logistics`
                      : "Untitled shipment story | Kungfu Jew Logistics"}
                  </h4>

                  {/* Google Meta Description Snippet */}
                  <p className="text-sm leading-relaxed text-[#4d5156] dark:text-[#bdc1c6]">
                    {metaDescription.trim() ||
                      "Add a meta description to see how your story summary appears in organic search engine results."}
                  </p>

                  <p className="pt-1 text-[11px] text-[#70757a] dark:text-slate-400">
                    Destination: {destinationUrl}
                  </p>
                </div>

                {/* Thumbnail snippet */}
                <div className="hidden sm:block">
                  {coverPreviewUrl ? (
                    <div className="relative aspect-square size-24 overflow-hidden rounded-lg border border-[#d7deea] bg-[#e9edf3] dark:border-slate-800">
                      <Image
                        src={coverPreviewUrl}
                        alt="SERP thumbnail"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square size-24 flex-col items-center justify-center rounded-lg border border-dashed border-[#d7deea] bg-[#f1f5fa] text-[10px] text-[#59677c] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                      <ImageIcon className="mb-1 size-5" aria-hidden="true" />
                      No photo
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Social Card (Open Graph / Twitter Card) Preview */
            <div className="mx-auto max-w-xl overflow-hidden rounded-xl border border-[#dfe5ee] bg-white shadow-xs dark:border-slate-800 dark:bg-slate-950">
              <div className="relative aspect-[1.91/1] w-full bg-[#e9edf3] dark:bg-slate-900">
                {coverPreviewUrl ? (
                  <Image
                    src={coverPreviewUrl}
                    alt="Social card banner"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-[#59677c] dark:text-slate-400">
                    <ImageIcon className="size-8" aria-hidden="true" />
                    <span>Social share banner preview</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 p-4">
                <p className="text-[11px] font-semibold tracking-wider text-[#66748a] uppercase dark:text-slate-400">
                  kungfujew.com
                </p>
                <h4 className="line-clamp-1 font-semibold text-[#1d2b4f] dark:text-slate-100">
                  {title.trim() || "Untitled shipment story"}
                </h4>
                <p className="line-clamp-2 text-xs leading-5 text-[#59677c] dark:text-slate-400">
                  {metaDescription.trim() ||
                    "Add a meta description to summarize this logistics shipment story for social shares."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
