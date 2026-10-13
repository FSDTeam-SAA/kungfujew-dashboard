"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useFieldArray,
  useForm,
  useFormContext,
  FormProvider,
  useWatch,
} from "react-hook-form";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Globe,
  HelpCircle,
  ImageIcon,
  Loader2,
  Package,
  PenLine,
  Plus,
  RefreshCw,
  Trash2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { requestErrorMessage } from "@/features/dashboard/components/request-error";
import { isStoryDraftStale } from "../story-local-draft";
import { useStoryLocalRecovery } from "../hooks/use-story-local-recovery";
import {
  serviceLines,
  shipmentStatuses,
  normalizeStorySlug,
  storyFormSchema,
  type Story,
  type StoryFormValues,
} from "../schema";
import { useStoryActions } from "../hooks/use-stories";
import { StoryRichTextEditor } from "./story-rich-text-editor";

// ─── Constants ────────────────────────────────────────────────────────────────

const emptyStory: StoryFormValues = {
  title: "",
  slug: "",
  metaDescription: "",
  content: "",
  pickupLocation: "",
  destination: "",
  shipmentType: "",
  serviceLine: "",
  shipmentStatus: "pending",
  imageAlt: "",
  isPublished: false,
  faqs: [],
};

const META_DESCRIPTION_TARGET = { min: 150, ideal: 160, max: 160 };

// ─── Primitive helpers ─────────────────────────────────────────────────────────

const labelClass = "block text-sm font-medium text-[#1d2b4f]";
const inputClass =
  "mt-1 w-full bg-white text-sm focus-visible:border-[#012055] focus-visible:ring-[#012055]/20";
const selectClass =
  "mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-[#25324a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#012055]";

function Field({
  label,
  name,
  error,
  hint,
  children,
  aside,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={name} className={labelClass}>
          {label}
        </label>
        {aside}
      </div>
      {hint && <p className="mt-0.5 text-xs text-[#7b8ea6]">{hint}</p>}
      {children}
      {error && (
        <p
          id={name + "-error"}
          role="alert"
          className="mt-1 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Character counter badge ───────────────────────────────────────────────────

function CharCounter({
  value,
  max,
  ideal,
  min,
}: {
  value: number;
  max: number;
  ideal?: number;
  min?: number;
}) {
  const tooLong = value > max;
  const good = ideal !== undefined && value >= (min ?? 0) && value <= ideal;
  return (
    <span
      className={cn(
        "tabular-nums text-xs font-medium",
        tooLong ? "text-red-600" : good ? "text-emerald-600" : "text-[#7b8ea6]",
      )}
    >
      {value}/{max}
    </span>
  );
}

// ─── SEO indicator bar ─────────────────────────────────────────────────────────

function SeoBar({ value }: { value: string }) {
  const len = value.trim().length;
  const { min, ideal, max } = META_DESCRIPTION_TARGET;
  const pct = Math.min(100, (len / max) * 100);
  const tooShort = len > 0 && len < min;
  const good = len >= min && len <= ideal;
  const tooLong = len > max;
  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e0e6ee]">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            tooLong
              ? "bg-red-500"
              : good
                ? "bg-emerald-500"
                : tooShort
                  ? "bg-amber-400"
                  : "bg-[#b6c7dd]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-[#7b8ea6]">
        {len === 0
          ? `Aim for ${min}–${ideal} characters for best SEO.`
          : tooLong
            ? `${len - max} characters over the recommended ${max}.`
            : good
              ? "Great length for search results."
              : tooShort
                ? `${min - len} more characters recommended.`
                : `${ideal - len} characters to ideal length.`}
      </p>
    </div>
  );
}

// ─── Social preview snippet ────────────────────────────────────────────────────

function SocialPreview({
  title,
  desc,
  slug,
}: {
  title: string;
  desc: string;
  slug: string;
}) {
  const displayUrl = `stories.carcarriergroup.com/stories/${slug || "your-story-slug"}`;
  return (
    <div className="mt-3 rounded-lg border border-[#d7deea] bg-[#f8fafc] p-4">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-[#99a9bf]">
        Google Preview
      </p>
      <p className="text-sm font-medium text-[#1a0dab] line-clamp-1">
        {title || "Untitled shipment story"}
      </p>
      <p className="text-xs text-[#006621]">{displayUrl}</p>
      <p className="mt-1 text-xs leading-5 text-[#545454] line-clamp-2">
        {desc || "Add a meta description to see the preview here."}
      </p>
    </div>
  );
}

// ─── Cover image preview ───────────────────────────────────────────────────────

function CoverPreview({
  src,
  alt,
  onRemove,
}: {
  src: string;
  alt: string;
  onRemove: () => void;
}) {
  return (
    <div className="group relative aspect-[16/7] overflow-hidden rounded-lg bg-[#e9edf3]">
      <Image
        src={src}
        alt={alt || "Story cover"}
        fill
        unoptimized
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 700px"
      />
      <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/30 to-transparent">
        <button
          type="button"
          onClick={onRemove}
          className="m-3 flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-[#1d2b4f] shadow transition hover:bg-white"
        >
          <Trash2 className="size-3" />
          Remove image
        </button>
      </div>
    </div>
  );
}

// ─── Tab definitions ───────────────────────────────────────────────────────────

type TabId = "narrative" | "shipment" | "seo" | "faqs";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "narrative",
    label: "Narrative & Editor",
    icon: <PenLine className="size-4" />,
  },
  {
    id: "shipment",
    label: "Shipment Details",
    icon: <Package className="size-4" />,
  },
  { id: "seo", label: "SEO & Social", icon: <Globe className="size-4" /> },
  { id: "faqs", label: "FAQs", icon: <HelpCircle className="size-4" /> },
];

// ─── Tab: Narrative & Editor ───────────────────────────────────────────────────

function NarrativeTab({
  coverSrc,
  coverFile,
  onCoverChange,
  preview,
  coverNeedsReselection,
}: {
  coverSrc: string | null;
  coverFile: File | null;
  onCoverChange: (file: File | null) => void;
  preview: boolean;
  coverNeedsReselection: boolean;
}) {
  const {
    register,
    setValue,
    formState: { errors, isSubmitted },
  } = useFormContext<StoryFormValues>();
  const title = useWatch<StoryFormValues, "title">({ name: "title" });
  const content = useWatch<StoryFormValues, "content">({ name: "content" });
  const imageAlt = useWatch<StoryFormValues, "imageAlt">({ name: "imageAlt" });
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      {/* Title */}
      <Field label="Story title" name="title" error={errors.title?.message}>
        <Input
          id="title"
          {...register("title")}
          placeholder="A memorable title for this shipment"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
          className="mt-2 h-12 border-[#d7deea] text-lg font-semibold text-[#1d2b4f] sm:text-xl"
        />
      </Field>

      {/* Cover image */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-[#1d2b4f]">Cover image</p>
        {coverSrc ? (
          <>
            <CoverPreview
              src={coverSrc}
              alt={imageAlt || title || "Story cover"}
              onRemove={() => onCoverChange(null)}
            />
            <Field
              label="Image alt text"
              name="imageAlt"
              error={errors.imageAlt?.message}
            >
              <Input
                id="imageAlt"
                {...register("imageAlt")}
                placeholder="Describe the image for screen readers"
                className={inputClass}
              />
            </Field>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#c3d0e3] bg-[#f6f8fb] py-10 text-sm text-[#7b8ea6] transition hover:border-[#012055]/40 hover:bg-[#eef2f8] hover:text-[#1d2b4f]"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-[#e0e9f4]">
                <ImageIcon className="size-6 text-[#012055]" />
              </div>
              <span>
                <span className="font-semibold text-[#012055]">
                  Choose a cover image
                </span>
              </span>
              <span className="text-xs">
                JPEG, PNG, WebP, GIF or AVIF · up to 10 MiB
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={(e) => onCoverChange(e.target.files?.[0] ?? null)}
            />
            {coverNeedsReselection && !coverFile && (
              <p
                role="status"
                className="mt-1 text-xs font-medium text-amber-800"
              >
                Re-select the cover image from the restored draft.
              </p>
            )}
          </>
        )}
      </div>

      {/* Rich text editor */}
      <StoryRichTextEditor
        value={content}
        preview={preview}
        onChange={(html) =>
          setValue("content", html, {
            shouldDirty: true,
            shouldValidate: isSubmitted,
          })
        }
        error={errors.content?.message}
      />
    </div>
  );
}

// ─── Tab: Shipment Details ─────────────────────────────────────────────────────

function ShipmentTab() {
  const {
    register,
    formState: { errors },
  } = useFormContext<StoryFormValues>();
  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-[#59677c]">
        These details help readers understand the context and route of the
        shipment.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Pickup location"
          name="pickupLocation"
          error={errors.pickupLocation?.message}
        >
          <Input
            id="pickupLocation"
            {...register("pickupLocation")}
            placeholder="e.g. Chicago, IL"
            aria-invalid={Boolean(errors.pickupLocation)}
            className={inputClass}
          />
        </Field>

        <Field
          label="Destination"
          name="destination"
          error={errors.destination?.message}
        >
          <Input
            id="destination"
            {...register("destination")}
            placeholder="e.g. Los Angeles, CA"
            aria-invalid={Boolean(errors.destination)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Shipment type"
        name="shipmentType"
        error={errors.shipmentType?.message}
        hint="Vehicle year, make, model or freight category"
      >
        <Input
          id="shipmentType"
          {...register("shipmentType")}
          placeholder="e.g. 2022 Tesla Model 3"
          aria-invalid={Boolean(errors.shipmentType)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Service line"
          name="serviceLine"
          error={errors.serviceLine?.message}
        >
          <select
            id="serviceLine"
            {...register("serviceLine")}
            aria-invalid={Boolean(errors.serviceLine)}
            className={selectClass}
          >
            <option value="">Select service line</option>
            {serviceLines.map((line) => (
              <option key={line} value={line}>
                {line.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Shipment status"
          name="shipmentStatus"
          error={errors.shipmentStatus?.message}
        >
          <select
            id="shipmentStatus"
            {...register("shipmentStatus")}
            aria-invalid={Boolean(errors.shipmentStatus)}
            className={selectClass}
          >
            {shipmentStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

// ─── Tab: SEO & Social ─────────────────────────────────────────────────────────

function SeoTab() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<StoryFormValues>();
  const title = useWatch<StoryFormValues, "title">({ name: "title" });
  const slug = useWatch<StoryFormValues, "slug">({ name: "slug" });
  const metaDescription = useWatch<StoryFormValues, "metaDescription">({
    name: "metaDescription",
  });
  const slugField = register("slug");

  const handleGenerateSlug = () => {
    const generated = normalizeStorySlug(title || "");
    if (generated)
      setValue("slug", generated, { shouldDirty: true, shouldValidate: true });
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.value = normalizeStorySlug(event.target.value);
    slugField.onChange(event);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-[#59677c]">
        Optimise how this story appears in search engines and social sharing
        previews.
      </p>

      {/* Slug */}
      <Field
        label="URL slug"
        name="slug"
        error={errors.slug?.message}
        hint="The unique path for this story. Spaces and punctuation become hyphens automatically."
        aside={
          <button
            type="button"
            onClick={handleGenerateSlug}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[#012055] transition hover:bg-[#e8edf4]"
          >
            <Wand2 className="size-3" />
            Auto-generate from title
          </button>
        }
      >
        <div className="mt-1 flex items-center gap-0">
          <span className="flex h-10 items-center rounded-l-md border border-r-0 border-[#d7deea] bg-[#f1f5fa] px-3 text-xs text-[#7b8ea6] select-none">
            /stories/
          </span>
          <Input
            id="slug"
            {...slugField}
            onChange={handleSlugChange}
            aria-invalid={Boolean(errors.slug)}
            aria-describedby={errors.slug ? "slug-error" : undefined}
            className="rounded-l-none border-[#d7deea] bg-white text-sm focus-visible:border-[#012055] focus-visible:ring-[#012055]/20"
          />
        </div>
      </Field>

      {/* Meta description */}
      <Field
        label="Meta description"
        name="metaDescription"
        error={errors.metaDescription?.message}
        aside={
          <CharCounter
            value={metaDescription.length}
            max={META_DESCRIPTION_TARGET.max}
            min={META_DESCRIPTION_TARGET.min}
            ideal={META_DESCRIPTION_TARGET.ideal}
          />
        }
      >
        <Textarea
          id="metaDescription"
          {...register("metaDescription")}
          rows={4}
          placeholder="A short summary for search results and social sharing…"
          aria-invalid={Boolean(errors.metaDescription)}
          aria-describedby={
            errors.metaDescription ? "metaDescription-error" : undefined
          }
          className={inputClass}
        />
        <SeoBar value={metaDescription} />
      </Field>

      {/* Social preview */}
      <div>
        <p className="text-sm font-medium text-[#1d2b4f]">
          Search & social preview
        </p>
        <SocialPreview title={title} desc={metaDescription} slug={slug} />
      </div>

      {/* Publication control */}
      <div className="rounded-xl border border-[#b6c7dd] bg-[#f1f5fa] p-5">
        <h3 className="font-semibold text-[#1d2b4f]">Publication</h3>
        <label className="mt-3 flex min-h-11 items-center gap-3 text-sm font-medium text-[#1d2b4f]">
          <input
            type="checkbox"
            {...register("isPublished")}
            className="size-5 accent-[#012055]"
          />
          Publish on save
        </label>
        <p className="mt-1 text-xs leading-5 text-[#59677c]">
          Leave this off to keep the story as a draft. Published stories appear
          on the website immediately.
        </p>
      </div>
    </div>
  );
}

// ─── Tab: FAQs ─────────────────────────────────────────────────────────────────

function FaqsTab() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<StoryFormValues>();
  const faqs = useFieldArray({ control, name: "faqs" });
  const faqValues = useWatch({ control, name: "faqs" });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[#59677c]">
        Add common questions and answers that will appear below the story. FAQs
        improve SEO and help readers quickly find key information.
      </p>

      <div className="space-y-3">
        {faqs.fields.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#d7deea] py-10 text-center text-sm text-[#7b8ea6]">
            <HelpCircle className="size-8 text-[#b6c7dd]" />
            <div>
              <p className="font-medium text-[#1d2b4f]">No FAQs yet</p>
              <p className="text-xs">
                Add your first question and answer below.
              </p>
            </div>
          </div>
        )}

        {faqs.fields.map((field, index) => {
          const questionError = errors.faqs?.[index]?.question?.message;
          const answerError = errors.faqs?.[index]?.answer?.message;
          const hasError = Boolean(questionError || answerError);
          const isCollapsed = collapsed.has(field.id) && !hasError;
          return (
            <div
              key={field.id}
              className={cn(
                "rounded-xl border bg-white transition-shadow",
                hasError ? "border-red-300" : "border-[#d7deea]",
              )}
            >
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggle(field.id)}
                  aria-expanded={!isCollapsed}
                  aria-controls={`faq-panel-${field.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e0e9f4] text-xs font-semibold text-[#012055]">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-[#1d2b4f]">
                    {faqValues[index]?.question || (
                      <span className="text-[#99a9bf] italic">
                        Untitled question
                      </span>
                    )}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="ml-auto size-4 shrink-0 text-[#7b8ea6]" />
                  ) : (
                    <ChevronUp className="ml-auto size-4 shrink-0 text-[#7b8ea6]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => faqs.remove(index)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#7b8ea6] transition hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove question ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {!isCollapsed && (
                <div
                  id={`faq-panel-${field.id}`}
                  className="space-y-4 border-t border-[#e8edf4] px-4 pb-4 pt-4"
                >
                  <Field
                    label="Question"
                    name={`faq-question-${index}`}
                    error={questionError}
                  >
                    <Input
                      id={`faq-question-${index}`}
                      {...register(`faqs.${index}.question`)}
                      placeholder="What do customers often ask about this shipment?"
                      aria-invalid={Boolean(questionError)}
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label="Answer"
                    name={`faq-answer-${index}`}
                    error={answerError}
                  >
                    <Textarea
                      id={`faq-answer-${index}`}
                      {...register(`faqs.${index}.answer`)}
                      rows={3}
                      placeholder="Provide a clear, helpful answer…"
                      aria-invalid={Boolean(answerError)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={faqs.fields.length >= 20}
        onClick={() => faqs.append({ question: "", answer: "" })}
        className="w-full border-dashed border-[#b6c7dd] text-[#012055] hover:bg-[#eef2f8]"
      >
        <Plus className="mr-2 size-4" />
        Add FAQ
      </Button>
    </div>
  );
}

// ─── Preview intro card (for Review story mode) ────────────────────────────────

function PreviewIntro({
  values,
  coverSrc,
  coverAlt,
}: {
  values: StoryFormValues;
  coverSrc: string | null;
  coverAlt: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#d7deea] bg-white">
      {coverSrc ? (
        <div className="relative aspect-[16/8] bg-[#e9edf3]">
          <Image
            src={coverSrc}
            alt={coverAlt}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 900px"
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center gap-2 bg-[#e9edf3] text-sm text-[#59677c]">
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
          <span>{values.shipmentStatus.replaceAll("_", " ")}</span>
        </div>
        <div>
          <h3 className="font-serif text-3xl leading-tight text-[#1d2b4f] sm:text-4xl">
            {values.title.trim() || "Untitled shipment story"}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#4f5c70]">
            {values.metaDescription.trim() ||
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
  );
}

// ─── Tab error count badge ─────────────────────────────────────────────────────

function tabErrorCount(
  tab: TabId,
  errors: ReturnType<
    typeof useFormContext<StoryFormValues>
  >["formState"]["errors"],
): number {
  switch (tab) {
    case "narrative":
      return [errors.title, errors.content, errors.imageAlt].filter(Boolean)
        .length;
    case "shipment":
      return [
        errors.pickupLocation,
        errors.destination,
        errors.shipmentType,
        errors.serviceLine,
        errors.shipmentStatus,
      ].filter(Boolean).length;
    case "seo":
      return [errors.slug, errors.metaDescription].filter(Boolean).length;
    case "faqs":
      return errors.faqs
        ? Array.isArray(errors.faqs)
          ? errors.faqs.filter(Boolean).length
          : 1
        : 0;
    default:
      return 0;
  }
}

// ─── Recovery status label ────────────────────────────────────────────────────

function RecoveryStatus({
  status,
  isDirty,
}: {
  status: string;
  isDirty: boolean;
}) {
  if (status === "saved")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="size-3" /> Saved locally
      </span>
    );
  if (status === "unavailable")
    return (
      <span className="text-xs text-amber-600">Local recovery unavailable</span>
    );
  return (
    <span className="text-xs text-[#7b8ea6]">
      {isDirty ? "Unsaved changes" : "No unsaved changes"}
    </span>
  );
}

// ─── Main StoryEditor component ────────────────────────────────────────────────

export function StoryEditor({
  story,
  onClose,
  onSaved,
}: {
  story?: Story;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const actions = useStoryActions();
  const [baseUpdatedAt] = useState(story?.updatedAt);
  const { data: session } = useSession();
  const [preview, setPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("narrative");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const coverObjectUrl = useRef<string | null>(null);
  const saving = useRef(false);
  const [submitError, setSubmitError] = useState("");

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: story
      ? {
          title: story.title,
          slug: story.slug,
          metaDescription: story.metaDescription,
          content: story.content,
          pickupLocation: story.pickupLocation,
          destination: story.destination,
          shipmentType: story.shipmentType,
          serviceLine: story.serviceLine ?? "",
          shipmentStatus: story.shipmentStatus,
          imageAlt: story.imageAlt ?? "",
          image: story.image ?? "",
          isPublished: story.isPublished,
          faqs: story.faqs ?? [],
        }
      : emptyStory,
  });

  // Subscribe only to the fields that drive header display — avoids global re-render
  const isPublished = useWatch({ control: form.control, name: "isPublished" });
  const savedImage = useWatch({ control: form.control, name: "image" });
  const title = useWatch({ control: form.control, name: "title" });
  const slug = useWatch({ control: form.control, name: "slug" });
  const lastGeneratedSlug = useRef("");
  const coverSrc = coverPreviewUrl ?? savedImage ?? null;

  useEffect(() => {
    if (story) return;

    const generatedSlug = normalizeStorySlug(title ?? "");
    if (!generatedSlug || (slug && slug !== lastGeneratedSlug.current)) return;

    lastGeneratedSlug.current = generatedSlug;
    if (slug !== generatedSlug) {
      form.setValue("slug", generatedSlug, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, slug, story, title]);

  const recovery = useStoryLocalRecovery({
    form,
    story: story ? { ...story, updatedAt: baseUpdatedAt } : undefined,
    userId: session?.user?.id,
    coverFile,
  });

  const { errors, isDirty, isSubmitted } = form.formState;

  const saveLabel = isPublished
    ? story?.isPublished
      ? "Save changes"
      : "Publish story"
    : "Save draft";

  useEffect(() => {
    return () => {
      if (coverObjectUrl.current) URL.revokeObjectURL(coverObjectUrl.current);
    };
  }, []);

  const changeCover = useCallback(
    (file: File | null) => {
      if (
        file &&
        (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type) ||
          file.size > 10 * 1024 * 1024 ||
          !file.size)
      ) {
        setSubmitError(
          "Choose a JPEG, PNG, WebP, GIF or AVIF cover image up to 10 MiB.",
        );
        return;
      }
      setSubmitError("");
      if (coverObjectUrl.current) URL.revokeObjectURL(coverObjectUrl.current);
      coverObjectUrl.current = file ? URL.createObjectURL(file) : null;
      setCoverFile(file);
      setCoverPreviewUrl(coverObjectUrl.current);
      if (!file) form.setValue("image", "", { shouldDirty: true });
    },
    [form],
  );

  const closeEditor = () => {
    if (saving.current) return;
    if (recovery.pendingDraft || !recovery.ready) {
      onClose();
      return;
    }
    if (isDirty || coverFile) {
      const stored = recovery.persist(form.getValues());
      const message = stored
        ? "Leave the editor? Your unsaved changes will stay in this browser."
        : "Local recovery is unavailable. Leave and lose unsaved changes?";
      if (!window.confirm(message)) return;
    }
    onClose();
  };

  const submit = (event?: React.BaseSyntheticEvent) =>
    form.handleSubmit(
      async (currentValues) => {
        if (saving.current) return;
        setSubmitError("");
        if (
          coverFile &&
          (!/^image\/(jpeg|png|webp|gif|avif)$/.test(coverFile.type) ||
            coverFile.size > 10 * 1024 * 1024)
        ) {
          setSubmitError(
            "Choose a JPEG, PNG, WebP, GIF or AVIF cover image up to 10 MiB.",
          );
          return;
        }
        recovery.persist(currentValues);
        saving.current = true;
        try {
          await actions.save.mutateAsync({
            values: currentValues,
            id: story?._id,
            image: coverFile,
            baseUpdatedAt,
          });
          recovery.clear();
          onSaved(story ? "Story updated." : "Story created.");
        } catch (error) {
          setSubmitError(requestErrorMessage(error));
        } finally {
          saving.current = false;
        }
      },
      (validationErrors) => {
        setPreview(false);
        setSubmitError("Review the highlighted fields before saving.");
        // Navigate to the first tab that has errors
        for (const tab of TABS) {
          if (tabErrorCount(tab.id, validationErrors) > 0) {
            setActiveTab(tab.id);
            break;
          }
        }
      },
    )(event);

  const values = form.getValues();

  return (
    <FormProvider {...form}>
      <section
        className="flex min-h-screen flex-col"
        aria-labelledby="story-editor-title"
      >
        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-30 border-b border-[#dfe5ee] bg-white/95 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {/* Top row */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-[#59677c] transition hover:bg-[#f1f5fa] hover:text-[#1d2b4f]"
                >
                  <ArrowLeft className="size-4" />
                  Stories
                </button>
                <span className="text-[#d7deea]">/</span>
                <h2
                  id="story-editor-title"
                  className="truncate text-sm font-semibold text-[#1d2b4f]"
                >
                  {story ? "Edit story" : "Create story"}
                </h2>
              </div>

              <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
                {/* Status badge */}
                <span
                  className={cn(
                    "hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex",
                    isPublished
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800",
                  )}
                >
                  {isPublished ? "Publishing on save" : "Draft"}
                </span>

                {/* Recovery status */}
                <span className="hidden items-center lg:flex">
                  <RecoveryStatus status={recovery.status} isDirty={isDirty} />
                </span>

                {/* Preview toggle */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreview((c) => !c)}
                  aria-pressed={preview}
                  className="border-[#012055] bg-white text-[#012055] hover:bg-[#eaf0f8]"
                >
                  {preview ? (
                    <PenLine className="mr-1.5 size-3.5" aria-hidden="true" />
                  ) : (
                    <Eye className="mr-1.5 size-3.5" aria-hidden="true" />
                  )}
                  {preview ? "Continue writing" : "Review story"}
                </Button>

                {/* Save button */}
                <Button
                  type="button"
                  disabled={
                    actions.save.isPending ||
                    form.formState.isSubmitting ||
                    !recovery.ready ||
                    Boolean(recovery.pendingDraft)
                  }
                  onClick={() => void submit()}
                  className="min-h-9 bg-[#012055] px-5 text-white hover:bg-[#1d2b4f] disabled:opacity-60"
                >
                  {actions.save.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    saveLabel
                  )}
                </Button>
              </div>
            </div>

            {/* Tab bar (hidden in preview mode) */}
            {!preview && (
              <nav
                className="-mb-px flex gap-0 overflow-x-auto"
                aria-label="Editor sections"
              >
                {TABS.map((tab) => {
                  const errCount = isSubmitted
                    ? tabErrorCount(tab.id, errors)
                    : 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={activeTab === tab.id ? "page" : undefined}
                      className={cn(
                        "relative flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                        activeTab === tab.id
                          ? "border-[#012055] text-[#012055]"
                          : "border-transparent text-[#59677c] hover:border-[#c3d0e3] hover:text-[#1d2b4f]",
                      )}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      {errCount > 0 && (
                        <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {errCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        </div>

        {/* ── Draft recovery banner ── */}
        {recovery.pendingDraft && (
          <div
            role="status"
            className="border-b border-[#b6c7dd] bg-[#eaf0f8] px-4 py-3"
          >
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-[#1d2b4f]">
                <span className="font-semibold">
                  An unsaved version is available.
                </span>{" "}
                Saved {new Date(recovery.pendingDraft.savedAt).toLocaleString()}
                .
                {isStoryDraftStale(recovery.pendingDraft, story?.updatedAt) &&
                  " The server story changed after this draft — review carefully."}
                {recovery.pendingDraft.hadCoverFile &&
                  " Re-select the cover image after restoring."}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={recovery.restore}
                  className="bg-[#012055] text-white hover:bg-[#1d2b4f]"
                >
                  <RefreshCw className="mr-1.5 size-3.5" />
                  Restore version
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={recovery.discard}
                  className="bg-white"
                >
                  Discard version
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <form
            onSubmit={submit}
            noValidate
            inert={
              !recovery.ready ||
              Boolean(recovery.pendingDraft) ||
              actions.save.isPending ||
              form.formState.isSubmitting
            }
          >
            <fieldset
              disabled={actions.save.isPending || form.formState.isSubmitting}
              className="min-w-0"
            >
              {preview ? (
                /* Preview mode */
                <div className="mx-auto max-w-4xl space-y-6">
                  <PreviewIntro
                    values={values}
                    coverSrc={coverSrc}
                    coverAlt={
                      form.getValues("imageAlt") ||
                      form.getValues("title") ||
                      "Story cover"
                    }
                  />
                  <StoryRichTextEditor
                    value={form.getValues("content")}
                    preview={true}
                    onChange={() => {}}
                  />
                  {values.faqs.length > 0 && (
                    <div className="rounded-xl border border-[#d7deea] bg-white p-5 sm:p-9">
                      <h3 className="font-serif text-2xl text-[#1d2b4f]">
                        Common questions
                      </h3>
                      <dl className="mt-4 divide-y divide-[#e0e6ee]">
                        {values.faqs.map((faq, i) => (
                          <div key={i} className="py-4">
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
              ) : (
                /* Edit mode — tabbed */
                <div className="mx-auto max-w-4xl rounded-xl border border-[#d7deea] bg-white p-6 shadow-[0_12px_36px_rgba(1,32,85,0.05)] sm:p-8">
                  {activeTab === "narrative" && (
                    <NarrativeTab
                      coverSrc={coverSrc}
                      coverFile={coverFile}
                      onCoverChange={changeCover}
                      preview={false}
                      coverNeedsReselection={recovery.coverNeedsReselection}
                    />
                  )}
                  {activeTab === "shipment" && <ShipmentTab />}
                  {activeTab === "seo" && <SeoTab />}
                  {activeTab === "faqs" && <FaqsTab />}
                </div>
              )}
            </fieldset>
            {/* Error banner */}
            {submitError && (
              <p
                role="alert"
                className="mx-auto mt-5 max-w-4xl rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {submitError}
              </p>
            )}

            <div className="mx-auto mt-6 flex max-w-4xl items-center justify-end border-t border-[#dfe5ee] pt-5">
              <p className="mr-auto max-w-xl text-xs leading-5 text-[#7b8ea6]">
                {preview
                  ? "This is an unsaved preview. Review before publishing."
                  : "Local recovery stores unsaved work in this browser. Use Save to persist to the server."}
              </p>
            </div>
          </form>
        </div>
      </section>
    </FormProvider>
  );
}
