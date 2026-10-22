"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Plus,
  Trash2,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { StoryFormValues } from "../schema";
import type { FaqHistory } from "../hooks/use-faq-history";
const inputClass =
  "mt-1 w-full bg-white text-sm focus-visible:border-[#012055] focus-visible:ring-[#012055]/20";
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
      <label
        htmlFor={name}
        className="block text-sm font-medium text-[#1d2b4f]"
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="mt-1 text-xs text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function StoryFaqEditor({ history }: { history: FaqHistory }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<StoryFormValues>();
  const faqs = history;
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
    <div
      className="space-y-4"
      onKeyDown={(event) => {
        if (
          event.nativeEvent.isComposing ||
          event.nativeEvent.keyCode === 229 ||
          !(event.ctrlKey || event.metaKey) ||
          event.altKey
        )
          return;
        const key = event.key.toLowerCase();
        if (key !== "z" && key !== "y") return;
        event.preventDefault();
        if (key === "y" || event.shiftKey) history.redo();
        else history.undo();
      }}
      onCompositionStart={history.endGroup}
      onCompositionEnd={history.endGroup}
    >
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          aria-label="Undo FAQ edit"
          disabled={!history.canUndo}
          onMouseDown={(event) => event.preventDefault()}
          onClick={history.undo}
        >
          <Undo2 aria-hidden="true" />
          Undo
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-label="Redo FAQ edit"
          disabled={!history.canRedo}
          onMouseDown={(event) => event.preventDefault()}
          onClick={history.redo}
        >
          <Redo2 aria-hidden="true" />
          Redo
        </Button>
      </div>
      <p className="text-sm leading-6 text-[#59677c]">
        Add common questions and answers that will appear below the story. FAQs
        help readers quickly find key information.
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
                      onChange={(event) =>
                        history.edit(index, "question", event.target.value)
                      }
                      placeholder="What do customers often ask about this shipment?"
                      aria-invalid={Boolean(questionError)}
                      aria-describedby={
                        questionError
                          ? `faq-question-${index}-error`
                          : undefined
                      }
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
                      onChange={(event) =>
                        history.edit(index, "answer", event.target.value)
                      }
                      rows={3}
                      placeholder="Provide a clear, helpful answer…"
                      aria-invalid={Boolean(answerError)}
                      aria-describedby={
                        answerError ? `faq-answer-${index}-error` : undefined
                      }
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
        onClick={() => faqs.append()}
        className="w-full border-dashed border-[#b6c7dd] text-[#012055] hover:bg-[#eef2f8]"
      >
        <Plus className="mr-2 size-4" />
        Add FAQ
      </Button>
    </div>
  );
}
