"use client";

import { useFieldArray } from "react-hook-form";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  MessageSquareQuote,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { FaqsTabProps } from "../../types";

export function FaqsTab({ form }: FaqsTabProps) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "faqs",
  });

  return (
    <div className="space-y-6">
      {/* Tab Intro Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e0e6ee] pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareQuote
              className="size-5 text-[#012055] dark:text-blue-400"
              aria-hidden="true"
            />
            <h3 className="text-lg font-semibold text-[#1d2b4f] dark:text-slate-100">
              Frequently Asked Questions
            </h3>
          </div>
          <p className="mt-1 text-xs text-[#59677c] dark:text-slate-400">
            Provide answers to common questions about this route, equipment,
            handling, and delivery milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-[#d7deea] bg-[#f8fafc] text-xs font-medium text-[#1d2b4f] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {fields.length} {fields.length === 1 ? "FAQ" : "FAQs"}
          </Badge>

          {fields.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => append({ question: "", answer: "" })}
              className="h-8 gap-1.5 bg-[#012055] text-xs font-medium text-white hover:bg-[#1d2b4f] dark:bg-primary dark:text-primary-foreground"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add FAQ
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#b6c7dd] bg-[#f8fafc] p-8 text-center sm:p-12 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf0f8] text-[#012055] dark:bg-slate-800 dark:text-blue-300">
            <HelpCircle className="size-7" aria-hidden="true" />
          </div>
          <h4 className="text-base font-semibold text-[#1d2b4f] sm:text-lg dark:text-slate-100">
            No Frequently Asked Questions Yet
          </h4>
          <p className="mt-2 max-w-md text-xs leading-5 text-[#59677c] sm:text-sm dark:text-slate-400">
            Add clear FAQs to answer client concerns regarding equipment
            suitability, transit schedules, vehicle inspection, and insurance
            coverage.
          </p>
          <Button
            type="button"
            onClick={() => append({ question: "", answer: "" })}
            className="mt-6 gap-2 bg-[#012055] text-sm text-white hover:bg-[#1d2b4f] dark:bg-primary dark:text-primary-foreground"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add First FAQ
          </Button>
        </div>
      ) : (
        /* FAQ List Items */
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card
              key={field.id}
              className="overflow-hidden border-[#d7deea] bg-white shadow-xs transition-shadow hover:shadow-sm dark:border-slate-800 dark:bg-card"
            >
              <CardHeader className="flex flex-row items-center justify-between border-b border-[#f1f5fa] bg-[#fbfcfd] px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#eaf0f8] font-mono text-xs font-semibold text-[#012055] dark:bg-slate-800 dark:text-blue-300">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-[#66748a] uppercase dark:text-slate-400">
                    Question {index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Reorder Buttons */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    className="size-7 text-[#59677c] hover:text-[#1d2b4f] disabled:opacity-30 dark:text-slate-400"
                    title="Move question up"
                    aria-label={`Move question ${index + 1} up`}
                  >
                    <ArrowUp className="size-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => move(index, index + 1)}
                    disabled={index === fields.length - 1}
                    className="size-7 text-[#59677c] hover:text-[#1d2b4f] disabled:opacity-30 dark:text-slate-400"
                    title="Move question down"
                    aria-label={`Move question ${index + 1} down`}
                  >
                    <ArrowDown className="size-3.5" aria-hidden="true" />
                  </Button>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    className="size-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    title="Remove question"
                    aria-label={`Remove question ${index + 1}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-5">
                {/* Question Field */}
                <FormField
                  control={form.control}
                  name={`faqs.${index}.question`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        htmlFor={`faq-question-${index}`}
                        className="text-xs font-semibold text-[#1d2b4f] dark:text-slate-200"
                      >
                        Question
                      </FormLabel>
                      <FormControl>
                        <Input
                          id={`faq-question-${index}`}
                          placeholder="e.g. How long did this cross-country transport take?"
                          {...field}
                          className="bg-white text-sm dark:bg-slate-950"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Answer Field */}
                <FormField
                  control={form.control}
                  name={`faqs.${index}.answer`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        htmlFor={`faq-answer-${index}`}
                        className="text-xs font-semibold text-[#1d2b4f] dark:text-slate-200"
                      >
                        Answer
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id={`faq-answer-${index}`}
                          placeholder="Provide a detailed, helpful answer explaining routes, timelines, or equipment used..."
                          rows={3}
                          {...field}
                          className="bg-white text-sm dark:bg-slate-950"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}

          {/* Add Another FAQ CTA */}
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ question: "", answer: "" })}
              className="gap-2 border-[#b6c7dd] text-xs font-medium text-[#012055] hover:bg-[#eaf0f8] dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add another question
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
