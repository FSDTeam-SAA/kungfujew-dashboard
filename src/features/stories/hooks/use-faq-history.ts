import { useRef, useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { StoryFormValues } from "../schema";

type Faqs = StoryFormValues["faqs"];
const copy = (values: Faqs): Faqs => values.map((faq) => ({ ...faq }));

export function useFaqHistory(form: UseFormReturn<StoryFormValues>) {
  const array = useFieldArray({ control: form.control, name: "faqs" });
  const past = useRef<Faqs[]>([]);
  const future = useRef<Faqs[]>([]);
  const group = useRef<{ field: string; at: number } | null>(null);
  const [availability, setAvailability] = useState({
    canUndo: false,
    canRedo: false,
  });
  const notify = () => {
    const next = {
      canUndo: past.current.length > 0,
      canRedo: future.current.length > 0,
    };
    setAvailability((previous) =>
      previous.canUndo === next.canUndo && previous.canRedo === next.canRedo
        ? previous
        : next,
    );
  };
  const record = (field?: string) => {
    const availabilityChanged =
      past.current.length === 0 || future.current.length > 0;
    const now = Date.now();
    if (
      !field ||
      group.current?.field !== field ||
      now - group.current.at >= 500
    ) {
      past.current = [...past.current.slice(-99), copy(form.getValues("faqs"))];
    }
    group.current = field ? { field, at: now } : null;
    future.current = [];
    if (availabilityChanged) notify();
  };
  const apply = (values: Faqs) => {
    // Scalar updates keep the focused input and caret mounted during keyboard undo.
    if (values.length === form.getValues("faqs").length) {
      values.forEach((faq, index) => {
        form.setValue(`faqs.${index}.question`, faq.question, {
          shouldDirty: true,
          shouldValidate: form.formState.isSubmitted,
        });
        form.setValue(`faqs.${index}.answer`, faq.answer, {
          shouldDirty: true,
          shouldValidate: form.formState.isSubmitted,
        });
      });
    } else {
      const active = document.activeElement;
      const name =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
          ? active.name
          : null;
      array.replace(copy(values));
      const field = name?.match(/^faqs\.(\d+)\.(question|answer)$/);
      if (field && values.length) {
        const index = Math.min(Number(field[1]), values.length - 1);
        const key = field[2] === "question" ? "question" : "answer";
        queueMicrotask(() => form.setFocus(`faqs.${index}.${key}`));
      }
    }
    group.current = null;
    notify();
  };
  return {
    fields: array.fields,
    ...availability,
    edit(index: number, key: "question" | "answer", value: string) {
      if (form.getValues(`faqs.${index}.${key}`) === value) return;
      record(`${index}.${key}`);
      form.setValue(`faqs.${index}.${key}`, value, {
        shouldDirty: true,
        shouldValidate: form.formState.isSubmitted,
      });
    },
    append() {
      record();
      array.append({ question: "", answer: "" });
    },
    remove(index: number) {
      record();
      array.remove(index);
    },
    undo() {
      const previous = past.current.pop();
      if (!previous) return;
      future.current.push(copy(form.getValues("faqs")));
      apply(previous);
    },
    redo() {
      const next = future.current.pop();
      if (!next) return;
      past.current.push(copy(form.getValues("faqs")));
      apply(next);
    },
    reset() {
      past.current = [];
      future.current = [];
      group.current = null;
      notify();
    },
    endGroup() {
      group.current = null;
    },
  };
}

export type FaqHistory = ReturnType<typeof useFaqHistory>;
