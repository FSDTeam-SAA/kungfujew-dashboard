"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StoryRichTextEditor } from "./story-rich-text-editor";
import {
  RequestError,
  requestErrorMessage,
} from "@/features/dashboard/components/request-error";
import { useStory, useStories, useStoryActions } from "../hooks/use-stories";
import {
  serviceLines,
  shipmentStatuses,
  storyFormSchema,
  type Story,
  type StoryFormValues,
} from "../schema";

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

const inputClass = "mt-1 w-full";
const labelClass = "block text-sm font-medium text-[#1d2b4f]";

function Editor({
  story,
  onClose,
  onSaved,
}: {
  story?: Story;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const actions = useStoryActions();
  const [image, setImage] = useState<File | null>(null);
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
          isPublished: story.isPublished,
          faqs: story.faqs ?? [],
        }
      : emptyStory,
  });
  const faqs = useFieldArray({ control: form.control, name: "faqs" });
  const content = useWatch({ control: form.control, name: "content" });
  const isPublished = useWatch({ control: form.control, name: "isPublished" });
  const { errors } = form.formState;
  const saveLabel = isPublished
    ? story?.isPublished
      ? "Save changes"
      : "Publish story"
    : "Save draft";

  const closeEditor = () => {
    if (
      (form.formState.isDirty || image) &&
      !window.confirm("Discard unsaved story changes?")
    )
      return;
    onClose();
  };

  const submit = form.handleSubmit(async (values) => {
    setSubmitError("");
    if (
      image &&
      (!/^image\/(jpeg|png|webp|gif|avif)$/.test(image.type) ||
        image.size > 10 * 1024 * 1024)
    ) {
      setSubmitError(
        "Choose a JPEG, PNG, WebP, GIF or AVIF image up to 10 MiB.",
      );
      return;
    }
    try {
      await actions.save.mutateAsync({ values, id: story?._id, image });
      onSaved(story ? "Story updated." : "Story created.");
    } catch (error) {
      setSubmitError(requestErrorMessage(error));
    }
  });

  return (
    <section
      className="rounded-xl border bg-white p-4 shadow-sm sm:p-6"
      aria-labelledby="story-editor-title"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="story-editor-title"
            className="text-xl font-semibold text-[#1d2b4f]"
          >
            {story ? "Edit story" : "Create story"}
          </h2>
          <p className="text-sm text-[#535d70]">
            {story?.isPublished
              ? "Changes to this published story will appear on the website after saving."
              : "Save a draft before publishing when details need review."}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={closeEditor}>
          Back to stories
        </Button>
      </div>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" name="title" error={errors.title?.message}>
            <Input
              id="title"
              {...form.register("title")}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Slug" name="slug" error={errors.slug?.message}>
            <Input
              id="slug"
              {...form.register("slug")}
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? "slug-error" : undefined}
              className={inputClass}
            />
          </Field>
          <Field
            label="Pickup location"
            name="pickupLocation"
            error={errors.pickupLocation?.message}
          >
            <Input
              id="pickupLocation"
              {...form.register("pickupLocation")}
              aria-invalid={Boolean(errors.pickupLocation)}
              aria-describedby={
                errors.pickupLocation ? "pickupLocation-error" : undefined
              }
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
              {...form.register("destination")}
              aria-invalid={Boolean(errors.destination)}
              aria-describedby={
                errors.destination ? "destination-error" : undefined
              }
              className={inputClass}
            />
          </Field>
          <Field
            label="Shipment type"
            name="shipmentType"
            error={errors.shipmentType?.message}
          >
            <Input
              id="shipmentType"
              {...form.register("shipmentType")}
              aria-invalid={Boolean(errors.shipmentType)}
              aria-describedby={
                errors.shipmentType ? "shipmentType-error" : undefined
              }
              className={inputClass}
            />
          </Field>
          <Field
            label="Service line"
            name="serviceLine"
            error={errors.serviceLine?.message}
          >
            <select
              id="serviceLine"
              {...form.register("serviceLine")}
              aria-invalid={Boolean(errors.serviceLine)}
              aria-describedby={
                errors.serviceLine ? "serviceLine-error" : undefined
              }
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm"
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
              {...form.register("shipmentStatus")}
              aria-invalid={Boolean(errors.shipmentStatus)}
              aria-describedby={
                errors.shipmentStatus ? "shipmentStatus-error" : undefined
              }
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm"
            >
              {shipmentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Image alt text"
            name="imageAlt"
            error={errors.imageAlt?.message}
          >
            <Input
              id="imageAlt"
              {...form.register("imageAlt")}
              className={inputClass}
            />
          </Field>
        </div>
        <Field
          label="Meta description"
          name="metaDescription"
          error={errors.metaDescription?.message}
        >
          <Textarea
            id="metaDescription"
            {...form.register("metaDescription")}
            aria-invalid={Boolean(errors.metaDescription)}
            aria-describedby={
              errors.metaDescription ? "metaDescription-error" : undefined
            }
            className={inputClass}
          />
        </Field>
        <StoryRichTextEditor
          value={content}
          onChange={(content) =>
            form.setValue("content", content, {
              shouldDirty: true,
              shouldValidate: form.formState.isSubmitted,
            })
          }
          error={errors.content?.message}
        />
        <div>
          <label htmlFor="story-image" className={labelClass}>
            Story image
          </label>
          <Input
            id="story-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className={inputClass}
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          />
          {story?.image && (
            <p className="mt-1 text-xs text-[#535d70]">
              Current image is retained unless you choose a replacement.
            </p>
          )}
        </div>
        <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 font-semibold text-[#1d2b4f]">FAQs</legend>
          {faqs.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <label className={labelClass} htmlFor={`faq-question-${index}`}>
                  Question
                </label>
                <Input
                  id={`faq-question-${index}`}
                  {...form.register(`faqs.${index}.question`)}
                  aria-invalid={Boolean(errors.faqs?.[index]?.question)}
                  aria-describedby={
                    errors.faqs?.[index]?.question
                      ? `faq-question-${index}-error`
                      : undefined
                  }
                  className={inputClass}
                />
                {errors.faqs?.[index]?.question && (
                  <p
                    id={`faq-question-${index}-error`}
                    role="alert"
                    className="text-sm text-red-700"
                  >
                    {errors.faqs[index]?.question?.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass} htmlFor={`faq-answer-${index}`}>
                  Answer
                </label>
                <Input
                  id={`faq-answer-${index}`}
                  {...form.register(`faqs.${index}.answer`)}
                  aria-invalid={Boolean(errors.faqs?.[index]?.answer)}
                  aria-describedby={
                    errors.faqs?.[index]?.answer
                      ? `faq-answer-${index}-error`
                      : undefined
                  }
                  className={inputClass}
                />
                {errors.faqs?.[index]?.answer && (
                  <p
                    id={`faq-answer-${index}-error`}
                    role="alert"
                    className="text-sm text-red-700"
                  >
                    {errors.faqs[index]?.answer?.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => faqs.remove(index)}
                className="self-end"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => faqs.append({ question: "", answer: "" })}
          >
            Add FAQ
          </Button>
        </fieldset>
        <label className="flex items-center gap-3 text-sm font-medium text-[#1d2b4f]">
          <input
            type="checkbox"
            {...form.register("isPublished")}
            className="size-4 accent-[#012055]"
          />{" "}
          Publish on save
        </label>
        {submitError && (
          <p role="alert" className="text-sm text-red-700">
            {submitError}
          </p>
        )}
        <Button type="submit" disabled={actions.save.isPending}>
          {actions.save.isPending ? "Saving…" : saveLabel}
        </Button>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
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

export function StoriesView() {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [published, setPublished] = useState<"all" | "true" | "false">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const params = { page, search: search || undefined, isPublished: published };
  const query = useStories(params);
  const detail = useStory(editing && editing !== "new" ? editing : null);
  const actions = useStoryActions();

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  };

  const publish = async (story: Story) => {
    setActionError("");
    try {
      await actions.publish.mutateAsync({
        id: story._id,
        isPublished: !story.isPublished,
      });
      setNotice(
        story.isPublished ? "Story moved to drafts." : "Story published.",
      );
    } catch (error) {
      setActionError(requestErrorMessage(error));
    }
  };

  const remove = async (story: Story) => {
    if (!window.confirm(`Delete “${story.title}”? This cannot be undone.`))
      return;
    setActionError("");
    try {
      await actions.remove.mutateAsync(story._id);
      setNotice("Story deleted.");
    } catch (error) {
      setActionError(requestErrorMessage(error));
    }
  };

  if (editing) {
    if (editing !== "new" && detail.isPending)
      return <p role="status">Loading story…</p>;
    if (editing !== "new" && detail.error)
      return (
        <RequestError
          error={detail.error}
          retry={() => void detail.refetch()}
        />
      );
    return (
      <Editor
        key={editing}
        story={editing === "new" ? undefined : detail.data}
        onClose={() => setEditing(null)}
        onSaved={(message) => {
          setNotice(message);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1d2b4f]">
            Shipment stories
          </h2>
          <p className="text-sm text-[#535d70]">
            Manage drafts and published stories.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>Create story</Button>
      </div>
      <form
        onSubmit={submitSearch}
        className="flex flex-wrap gap-3 rounded-xl border bg-white p-4"
      >
        <label htmlFor="story-search" className="sr-only">
          Search stories
        </label>
        <Input
          id="story-search"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Search stories"
          className="min-w-52 flex-1"
        />
        <label htmlFor="story-published" className="sr-only">
          Publication status
        </label>
        <select
          id="story-published"
          value={published}
          onChange={(event) => {
            setPublished(event.target.value as typeof published);
            setPage(1);
          }}
          className="h-10 rounded-md border px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="true">Published</option>
          <option value="false">Drafts</option>
        </select>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      {notice && (
        <p
          role="status"
          className="rounded-md bg-green-50 p-3 text-sm text-green-800"
        >
          {notice}
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {actionError}
        </p>
      )}
      {query.isPending && <p role="status">Loading stories…</p>}
      {query.error && (
        <RequestError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <>
          {query.data.data.length === 0 ? (
            <p className="rounded-xl border bg-white p-8 text-center text-[#535d70]">
              No stories found.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {query.data.data.map((story) => (
                <article
                  key={story._id}
                  className="flex flex-col rounded-xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[#1d2b4f]">
                      {story.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${story.isPublished ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}
                    >
                      {story.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[#535d70]">
                    {story.metaDescription}
                  </p>
                  <p className="mt-2 text-xs text-[#535d70]">
                    {story.serviceLine?.replaceAll("-", " ") ?? "Unassigned"} ·{" "}
                    {story.shipmentStatus.replaceAll("_", " ")}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(story._id)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={actions.publish.isPending}
                      onClick={() => void publish(story)}
                    >
                      {story.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={actions.remove.isPending}
                      onClick={() => void remove(story)}
                      className="text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-[#535d70]">
            <span>
              Page {query.data.pagination.page} of{" "}
              {Math.max(query.data.pagination.totalPages, 1)} ·{" "}
              {query.data.pagination.total} stories
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={page >= query.data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
