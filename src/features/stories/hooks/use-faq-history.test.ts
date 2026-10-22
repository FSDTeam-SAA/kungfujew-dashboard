import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { useFaqHistory } from "./use-faq-history";
import type { StoryFormValues } from "../schema";

function setup() {
  return renderHook(() => {
    const form = useForm<StoryFormValues>({
      defaultValues: { faqs: [{ question: "Original?", answer: "Answer." }] },
    });
    const history = useFaqHistory(form);
    return { form, history };
  });
}

afterEach(() => jest.restoreAllMocks());

it("groups typing until 500 ms of inactivity and separates fields", () => {
  let now = 0;
  jest.spyOn(Date, "now").mockImplementation(() => now);
  const { result } = setup();
  act(() => result.current.history.edit(0, "question", "First?"));
  now = 499;
  act(() => result.current.history.edit(0, "question", "Second?"));
  now = 999;
  act(() => result.current.history.edit(0, "question", "Third?"));
  act(() => result.current.history.edit(0, "answer", "Different."));
  act(() => result.current.history.undo());
  expect(result.current.form.getValues("faqs.0.answer")).toBe("Answer.");
  act(() => result.current.history.undo());
  expect(result.current.form.getValues("faqs.0.question")).toBe("Second?");
  act(() => result.current.history.undo());
  expect(result.current.form.getValues("faqs.0.question")).toBe("Original?");
});

it("retains only the last 100 edits", () => {
  let now = 0;
  jest.spyOn(Date, "now").mockImplementation(() => now);
  const { result } = setup();
  for (let index = 1; index <= 102; index++) {
    now += 500;
    act(() => result.current.history.edit(0, "question", String(index)));
  }
  for (let index = 0; index < 100; index++)
    act(() => result.current.history.undo());
  expect(result.current.form.getValues("faqs.0.question")).toBe("2");
  expect(result.current.history.canUndo).toBe(false);
});

it("undoes additions, redoes them and resets history without losing values", () => {
  const { result } = setup();
  act(() => result.current.history.append());
  expect(result.current.form.getValues("faqs")).toHaveLength(2);
  act(() => result.current.history.undo());
  expect(result.current.form.getValues("faqs")).toHaveLength(1);
  act(() => result.current.history.redo());
  expect(result.current.form.getValues("faqs")).toHaveLength(2);
  act(() => result.current.history.reset());
  expect(result.current.history.canUndo).toBe(false);
  expect(result.current.history.canRedo).toBe(false);
  expect(result.current.form.getValues("faqs")).toHaveLength(2);
});
