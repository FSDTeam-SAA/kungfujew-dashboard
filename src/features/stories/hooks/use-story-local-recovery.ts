import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { Story, StoryFormValues } from "../schema";
import {
  draftKey,
  readStoryDraft,
  removeStoryDraft,
  writeStoryDraft,
  type StoryLocalDraft,
} from "../story-local-draft";

export function useStoryLocalRecovery({
  form,
  story,
  userId,
  coverFile,
}: {
  form: UseFormReturn<StoryFormValues>;
  story?: Story;
  userId?: string;
  coverFile: File | null;
}) {
  const [pendingDraft, setPendingDraft] = useState<StoryLocalDraft | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "unavailable">(
    "idle",
  );
  const cleared = useRef(false);
  const [coverNeedsReselection, setCoverNeedsReselection] = useState(false);
  const key = userId ? draftKey(userId, story?._id ?? null) : null;

  useEffect(() => {
    if (!key) return;
    const timer = window.setTimeout(() => {
      const draft = readStoryDraft(key);
      if (
        draft &&
        (draft.hadCoverFile ||
          JSON.stringify(draft.values) !== JSON.stringify(form.getValues()))
      ) {
        setPendingDraft(draft);
      } else if (draft) {
        removeStoryDraft(key);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key, form, story?.updatedAt]);

  const persist = useCallback(
    (currentValues: StoryFormValues): boolean => {
      if (!key) return false;
      const saved = writeStoryDraft(key, {
        version: 1,
        savedAt: new Date().toISOString(),
        baseUpdatedAt: story?.updatedAt ?? null,
        hadCoverFile: Boolean(coverFile) || coverNeedsReselection,
        values: currentValues,
      });
      setStatus(saved ? "saved" : "unavailable");
      return saved;
    },
    [key, story?.updatedAt, coverFile, coverNeedsReselection],
  );

  useEffect(() => {
    if (!ready || pendingDraft || !key) return;
    let timer: number | undefined;
    let dirty = form.formState.isDirty;
    const schedule = (isDirty: boolean) => {
      dirty = isDirty;
      window.clearTimeout(timer);
      cleared.current = false;
      setStatus("idle");
      if (dirty || coverFile || coverNeedsReselection)
        timer = window.setTimeout(() => {
          if (!cleared.current) persist(form.getValues());
        }, 800);
    };
    const flush = () => {
      if (!cleared.current && (dirty || coverFile || coverNeedsReselection))
        persist(form.getValues());
    };
    const unsubscribe = form.subscribe({
      formState: { values: true, isDirty: true },
      callback: ({ isDirty }) => schedule(Boolean(isDirty)),
    });
    if (dirty || coverFile || coverNeedsReselection) schedule(dirty);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [
    ready,
    pendingDraft,
    key,
    form,
    form.formState.isDirty,
    coverFile,
    coverNeedsReselection,
    persist,
  ]);

  const restore = () => {
    if (!pendingDraft) return;
    form.reset(
      { ...form.getValues(), ...pendingDraft.values },
      { keepDefaultValues: true },
    );
    setCoverNeedsReselection(pendingDraft.hadCoverFile);
    setPendingDraft(null);
    setStatus("saved");
  };

  const discard = () => {
    if (key) removeStoryDraft(key);
    setPendingDraft(null);
    setCoverNeedsReselection(false);
    setStatus("idle");
  };

  const clear = () => {
    cleared.current = true;
    if (key) removeStoryDraft(key);
    setStatus("idle");
  };

  return {
    ready: ready || !key,
    pendingDraft,
    status,
    coverNeedsReselection,
    persist,
    restore,
    discard,
    clear,
  };
}
