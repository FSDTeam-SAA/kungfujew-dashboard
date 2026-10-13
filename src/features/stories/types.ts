import type { Control, UseFormReturn } from "react-hook-form";

/**
 * Service line categories supported across the logistics platform.
 * Matches backend `SERVICE_LINES` in `kungfujew-backend/src/modules/content/content.schemas.ts`.
 */
export type ServiceLine = "vehicle" | "freight" | "heavy-equipment";

/**
 * Current logistical fulfillment status for a real shipment story.
 * Matches backend `SHIPMENT_STATUSES` in `kungfujew-backend/src/modules/content/content.schemas.ts`.
 */
export type ShipmentStatus =
  "pending" | "in_transit" | "delivered" | "cancelled";

/**
 * Story Frequently Asked Question item.
 */
export interface StoryFAQ {
  question: string;
  answer: string;
}

/**
 * Complete form values structure managed by React Hook Form & validated by Zod.
 * Structurally aligned with `storyFormSchema` in `schema.ts`.
 */
export interface StoryFormValues {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  pickupLocation: string;
  destination: string;
  shipmentType: string;
  serviceLine: string;
  shipmentStatus: ShipmentStatus;
  imageAlt: string;
  isPublished: boolean;
  faqs: StoryFAQ[];
}

/**
 * Full Shipment Story domain model returned by the backend API.
 * Structurally aligned with `storySchema` in `schema.ts` and NestJS `Story` schema.
 */
export interface Story {
  _id: string;
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  pickupLocation: string;
  destination: string;
  shipmentType: string;
  serviceLine?: ServiceLine;
  shipmentStatus: ShipmentStatus;
  image?: string | null;
  imageAlt?: string;
  faqs?: StoryFAQ[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Standard pagination metadata returned from `/api/v1/real-shipment-stories`.
 */
export interface StoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
}

/**
 * Paginated envelope returned when querying the stories list.
 */
export interface StoryList {
  success: true;
  data: Story[];
  pagination: StoryPagination;
}

/**
 * Single story API response envelope.
 */
export interface StoryResponse {
  success: true;
  data: Story;
}

/**
 * Cloudinary image upload response envelope.
 */
export interface StoryImageUploadResponse {
  success: true;
  url: string;
}

/**
 * Query filter parameters supported by `/api/v1/real-shipment-stories`.
 */
export interface StoryQuery {
  page: number;
  limit?: number;
  search?: string;
  isPublished?: "all" | "true" | "false";
  serviceLine?: ServiceLine | "all";
  shipmentStatus?: ShipmentStatus | "all";
  shipmentType?: string;
}

/**
 * Serialized draft persisted in browser localStorage for crash recovery.
 */
export interface StoryLocalDraft {
  version: 1;
  savedAt: string;
  baseUpdatedAt: string | null;
  hadCoverFile: boolean;
  values: StoryFormValues;
}

/**
 * Granular recovery state for local autosave telemetry and status badges.
 */
export type StoryRecoveryStatus =
  "ready" | "stale" | "pending" | "unavailable" | "idle" | "saved";

/**
 * Tab identifiers for the 4-tab editorial workflow (R1).
 */
export type StoryTabId = "narrative" | "details" | "seo" | "faqs";

/**
 * Props for the root StoryEditor form component.
 */
export interface StoryEditorProps {
  story?: Story;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/**
 * Props for the enhanced TipTap rich text editor.
 */
export interface StoryRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  preview: boolean;
}

/**
 * Sticky header bar props isolating status telemetry and actions.
 */
export interface StoryEditorHeaderProps {
  control: Control<StoryFormValues>;
  isEditing: boolean;
  isPending: boolean;
  preview: boolean;
  onTogglePreview: () => void;
  onClose: () => void;
  recoveryStatus: StoryRecoveryStatus;
  formId?: string;
  onSave?: () => void;
  isDirty?: boolean;
}

/**
 * Tab 1: Narrative & TipTap rich text editor.
 */
export interface NarrativeTabProps {
  form: UseFormReturn<StoryFormValues>;
  coverFile: File | null;
  onCoverChange: (file: File | null) => void;
  coverPreviewUrl: string | null;
  existingImageUrl?: string;
  preview: boolean;
  coverNeedsReselection?: boolean;
}

/**
 * Tab 2: Shipment logistical facts and routing.
 */
export interface ShipmentDetailsTabProps {
  form: UseFormReturn<StoryFormValues>;
}

/**
 * Tab 3: SEO metadata, 1-click slug generator, and social card preview snippet.
 */
export interface SeoSocialTabProps {
  form: UseFormReturn<StoryFormValues>;
  coverPreviewUrl?: string | null;
}

/**
 * Tab 4: Frequently Asked Questions inline management.
 */
export interface FaqsTabProps {
  form: UseFormReturn<StoryFormValues>;
}

/**
 * Preview summary card props for full story review.
 */
export interface PreviewIntroProps {
  values: StoryFormValues;
  coverSrc: string | null;
  coverAlt: string;
}

/**
 * Social search card snippet preview props.
 */
export interface SocialSnippetPreviewProps {
  title: string;
  slug: string;
  metaDescription: string;
  coverSrc?: string | null;
}

/**
 * Live editor metrics calculated in real-time.
 */
export interface EditorMetrics {
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
}

/**
 * SEO character count evaluation guidance.
 */
export interface SeoGuidance {
  charCount: number;
  targetMin: number;
  targetMax: number;
  status: "under" | "optimal" | "over";
  message: string;
}

/**
 * Props for the zero-CLS skeleton component.
 */
export interface StoryEditorSkeletonProps {
  className?: string;
}
