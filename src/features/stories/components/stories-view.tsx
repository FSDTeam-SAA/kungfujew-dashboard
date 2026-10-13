"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoryEditor } from "./story-editor";
import {
  RequestError,
  requestErrorMessage,
} from "@/features/dashboard/components/request-error";
import { useStory, useStories, useStoryActions } from "../hooks/use-stories";
import { serviceLines, type StorySummary } from "../schema";

export function StoriesView() {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [published, setPublished] = useState<"all" | "true" | "false">("all");
  const [serviceLine, setServiceLine] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const params = {
    page,
    search: search || undefined,
    isPublished: published,
    serviceLine: serviceLine === "all" ? undefined : serviceLine,
  };
  const query = useStories(params);
  const detail = useStory(editing && editing !== "new" ? editing : null);
  const actions = useStoryActions();
  const actionPending = actions.publish.isPending || actions.remove.isPending;
  const clearFilters = () => {
    setSearch("");
    setSearchDraft("");
    setPublished("all");
    setServiceLine("all");
    setPage(1);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  };

  const publish = async (story: StorySummary) => {
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

  const remove = async (story: StorySummary) => {
    if (!window.confirm(`Delete “${story.title}”? This cannot be undone.`))
      return;
    setActionError("");
    try {
      await actions.remove.mutateAsync(story._id);
      if (query.data?.data.length === 1 && page > 1) setPage(page - 1);
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
      <StoryEditor
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
            Turn shipment experience into clear, useful stories for prospective
            customers.
          </p>
        </div>
        <Button disabled={actionPending} onClick={() => setEditing("new")}>
          Create story
        </Button>
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
          maxLength={200}
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
        <label htmlFor="story-service-line" className="sr-only">
          Service line
        </label>
        <select
          id="story-service-line"
          value={serviceLine}
          onChange={(event) => {
            setServiceLine(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <option value="all">All services</option>
          {serviceLines.map((line) => (
            <option key={line} value={line}>
              {line.replaceAll("-", " ")}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Search
        </Button>
        {(search || published !== "all" || serviceLine !== "all") && (
          <Button type="button" variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
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
      {query.isPending && (
        <div
          role="status"
          aria-label="Loading stories"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-64 animate-pulse rounded-xl border bg-slate-100 motion-reduce:animate-none"
            />
          ))}
        </div>
      )}
      {query.isFetching && !query.isPending && (
        <p role="status" className="text-xs text-[#535d70]">
          Updating stories…
        </p>
      )}
      {query.error && (
        <RequestError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <>
          {query.data.data.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-[#535d70]">
              <p className="font-semibold text-[#1d2b4f]">No stories found</p>
              <p className="mt-2 text-sm">
                Try another keyword or service, or create your first shipment
                story.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="mt-4"
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {query.data.data.map((story) => (
                <article
                  key={story._id}
                  className="flex flex-col rounded-xl border bg-white p-5 shadow-sm"
                >
                  {story.image && (
                    <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
                      <Image
                        src={story.image}
                        alt={story.imageAlt || story.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
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
                  <p className="mt-3 text-sm font-medium text-[#1d2b4f]">
                    {story.pickupLocation} <span aria-hidden="true">→</span>
                    <span className="sr-only">to</span> {story.destination}
                  </p>
                  {!serviceLines.some((line) => line === story.serviceLine) && (
                    <p className="mt-2 text-xs text-amber-800">
                      Assign a service in the editor to make this story visible
                      on the website.
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(story._id)}
                      disabled={actionPending}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        actionPending ||
                        (!story.isPublished &&
                          !serviceLines.some(
                            (line) => line === story.serviceLine,
                          ))
                      }
                      onClick={() => void publish(story)}
                    >
                      {story.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={actionPending}
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
