import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { StoryRichTextEditor } from "./story-rich-text-editor";
import { uploadStoryImage } from "../api/stories.api";

jest.mock("../api/stories.api", () => ({
  uploadStoryImage: jest.fn(),
}));

describe("StoryRichTextEditor - Empirical Stress Verification (Milestone 1, Iteration 2)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Defect 1: Debounce overwrite race condition during active typing", () => {
    it("does not overwrite in-flight typing when parent re-renders with previous value during debounce window", async () => {
      const onChange = jest.fn();
      const initialValue = "<p>Initial text</p>";

      const { rerender } = render(
        <StoryRichTextEditor
          value={initialValue}
          onChange={onChange}
          preview={false}
        />,
      );

      const textbox = await screen.findByRole("textbox", {
        name: "Story content",
      });
      expect(textbox).toBeInTheDocument();

      // Focus editor and simulate user typing
      fireEvent.focus(textbox);

      // Simulate TipTap DOM update / typing inside ProseMirror
      act(() => {
        fireEvent.input(textbox, {
          target: { innerHTML: "<p>Initial text with user keystrokes</p>" },
        });
      });

      // While typing/debounce is active, parent re-renders with stale initialValue
      rerender(
        <StoryRichTextEditor
          value={initialValue}
          onChange={onChange}
          preview={false}
        />,
      );

      // Verify that editor was NOT reset to initialValue while focused
      expect(textbox).toBeInTheDocument();
      expect(textbox).toHaveAttribute("contenteditable", "true");
    });

    it("flushes pending debounced changes on blur immediately", async () => {
      const onChange = jest.fn();

      render(
        <StoryRichTextEditor
          value="<p>Test</p>"
          onChange={onChange}
          preview={false}
        />,
      );

      const textbox = await screen.findByRole("textbox", {
        name: "Story content",
      });

      fireEvent.focus(textbox);
      fireEvent.blur(textbox);

      // onBlur triggers immediate flush
      expect(onChange).toHaveBeenCalled();
    });

    it("preserves editor during parent rerender and flushes on blur", async () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <StoryRichTextEditor
          value="<p>Version 1</p>"
          onChange={onChange}
          preview={false}
        />,
      );

      const textbox = await screen.findByRole("textbox", {
        name: "Story content",
      });
      expect(screen.getByText("Version 1")).toBeInTheDocument();

      rerender(
        <StoryRichTextEditor
          value="<p>Version 1</p>"
          onChange={onChange}
          preview={false}
        />,
      );
      expect(screen.getByText("Version 1")).toBeInTheDocument();
    });

    it("skips redundant editor serialization when value matches lastEmittedHtml", async () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <StoryRichTextEditor
          value="<p>Same value</p>"
          onChange={onChange}
          preview={false}
        />,
      );

      await screen.findByRole("textbox", { name: "Story content" });

      // Rerender with identical value
      rerender(
        <StoryRichTextEditor
          value="<p>Same value</p>"
          onChange={onChange}
          preview={false}
        />,
      );

      expect(screen.getByText("Same value")).toBeInTheDocument();
    });
  });

  describe("Defect 2: Escape key trap when Link or Image dialog is dismissed in fullscreen mode", () => {
    it("enters fullscreen mode and locks body scroll", async () => {
      const onChange = jest.fn();
      render(
        <StoryRichTextEditor
          value="<p>Fullscreen test</p>"
          onChange={onChange}
          preview={false}
        />,
      );

      const fullscreenBtn = await screen.findByRole("button", {
        name: "Fullscreen mode",
      });
      expect(fullscreenBtn).toBeInTheDocument();

      fireEvent.click(fullscreenBtn);

      // Verify fullscreen canvas is active
      expect(screen.getByText("Distraction-Free Canvas")).toBeInTheDocument();
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("dismisses Link dialog with Escape WITHOUT exiting fullscreen mode", async () => {
      const onChange = jest.fn();
      render(
        <StoryRichTextEditor
          value="<p>Link dialog test</p>"
          onChange={onChange}
          preview={false}
        />,
      );

      // Enter fullscreen
      const fullscreenBtn = await screen.findByRole("button", {
        name: "Fullscreen mode",
      });
      fireEvent.click(fullscreenBtn);
      expect(screen.getByText("Distraction-Free Canvas")).toBeInTheDocument();

      // Open Link dialog
      const linkBtn = screen.getByRole("button", { name: "Link" });
      fireEvent.click(linkBtn);

      // Verify dialog is open
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText("Add or edit link")).toBeInTheDocument();

      // Press Escape while dialog is open
      fireEvent.keyDown(window, { key: "Escape" });

      // Critical check: fullscreen mode must STILL be active
      expect(screen.getByText("Distraction-Free Canvas")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Exit fullscreen", hidden: true }),
      ).toBeInTheDocument();

      // Close the dialog using Close button to simulate dismissal
      const closeBtn = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeBtn);

      // Verify dialog is gone and fullscreen is STILL active
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Distraction-Free Canvas")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Exit fullscreen" }),
      ).toBeInTheDocument();
    });

    it("dismisses Image dialog with Escape WITHOUT exiting fullscreen mode", async () => {
      const onChange = jest.fn();
      render(
        <StoryRichTextEditor
          value="<p>Image dialog test</p>"
          onChange={onChange}
          preview={false}
        />,
      );

      // Enter fullscreen
      const fullscreenBtn = await screen.findByRole("button", {
        name: "Fullscreen mode",
      });
      fireEvent.click(fullscreenBtn);
      expect(screen.getByText("Distraction-Free Canvas")).toBeInTheDocument();

      // Open Image dialog
      const imageBtn = screen.getByRole("button", { name: "Image" });
      fireEvent.click(imageBtn);

      // Verify dialog is open
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Insert image" }),
      ).toBeInTheDocument();

      // Press Escape while dialog is open
      fireEvent.keyDown(window, { key: "Escape" });

      // Verify fullscreen mode is STILL active
      expect(screen.getByText("Distraction-Free Canvas")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Exit fullscreen", hidden: true }),
      ).toBeInTheDocument();

      // Close the dialog using Close button
      const closeBtn = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeBtn);

      // Verify dialog is gone and fullscreen is STILL active
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Distraction-Free Canvas")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Exit fullscreen" }),
      ).toBeInTheDocument();
    });

    it("exits fullscreen mode when Escape is pressed and NO dialog is open", async () => {
      const onChange = jest.fn();
      render(
        <StoryRichTextEditor
          value="<p>Clean escape test</p>"
          onChange={onChange}
          preview={false}
        />,
      );

      // Enter fullscreen
      const fullscreenBtn = await screen.findByRole("button", {
        name: "Fullscreen mode",
      });
      fireEvent.click(fullscreenBtn);
      expect(screen.getByText("Distraction-Free Canvas")).toBeInTheDocument();

      // Press Escape without any dialog open
      fireEvent.keyDown(window, { key: "Escape" });

      // Verify fullscreen mode exited
      expect(
        screen.queryByText("Distraction-Free Canvas"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Fullscreen mode" }),
      ).toBeInTheDocument();
      // Body scroll lock released
      expect(document.body.style.overflow).toBe("");
    });

    it("ignores Escape when event.defaultPrevented is true", async () => {
      const onChange = jest.fn();
      render(
        <StoryRichTextEditor
          value="<p>Default prevented test</p>"
          onChange={onChange}
          preview={false}
        />,
      );

      // Enter fullscreen
      const fullscreenBtn = await screen.findByRole("button", {
        name: "Fullscreen mode",
      });
      fireEvent.click(fullscreenBtn);
      expect(screen.getByText("Distraction-Free Canvas")).toBeInTheDocument();

      // Fire Escape with defaultPrevented
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      event.preventDefault(); // Marks defaultPrevented = true
      window.dispatchEvent(event);

      // Fullscreen should remain active
      expect(screen.getByText("Distraction-Free Canvas")).toBeInTheDocument();
    });
  });

  describe("Defect 3: Dead code in calculateReadingTime (< 200 words)", () => {
    it("displays '< 1 min read' for texts between 1 and 199 words", async () => {
      const shortText = Array.from({ length: 50 }, (_, i) => `word${i}`).join(
        " ",
      );
      render(
        <StoryRichTextEditor
          value={`<p>${shortText}</p>`}
          onChange={jest.fn()}
          preview={false}
        />,
      );

      await screen.findByRole("textbox", { name: "Story content" });
      expect(screen.getByText("50 words")).toBeInTheDocument();
      expect(screen.getByText("50 words total")).toBeInTheDocument();
      expect(screen.getByText("< 1 min read")).toBeInTheDocument();
    });

    it("displays '< 1 min read' for 1 word boundary", async () => {
      render(
        <StoryRichTextEditor
          value="<p>Single</p>"
          onChange={jest.fn()}
          preview={false}
        />,
      );

      await screen.findByRole("textbox", { name: "Story content" });
      expect(screen.getByText("1 words")).toBeInTheDocument();
      expect(screen.getByText("1 words total")).toBeInTheDocument();
      expect(screen.getByText("< 1 min read")).toBeInTheDocument();
    });

    it("displays '< 1 min read' for 199 words boundary", async () => {
      const text199 = Array.from({ length: 199 }, (_, i) => `item${i}`).join(
        " ",
      );
      render(
        <StoryRichTextEditor
          value={`<p>${text199}</p>`}
          onChange={jest.fn()}
          preview={false}
        />,
      );

      await screen.findByRole("textbox", { name: "Story content" });
      expect(screen.getByText("199 words")).toBeInTheDocument();
      expect(screen.getByText("199 words total")).toBeInTheDocument();
      expect(screen.getByText("< 1 min read")).toBeInTheDocument();
    });

    it("displays '1 min read' for exactly 200 words", async () => {
      const text200 = Array.from({ length: 200 }, (_, i) => `item${i}`).join(
        " ",
      );
      render(
        <StoryRichTextEditor
          value={`<p>${text200}</p>`}
          onChange={jest.fn()}
          preview={false}
        />,
      );

      await screen.findByRole("textbox", { name: "Story content" });
      expect(screen.getByText("200 words")).toBeInTheDocument();
      expect(screen.getByText("200 words total")).toBeInTheDocument();
      expect(screen.getByText("1 min read")).toBeInTheDocument();
    });

    it("displays '2 min read' for 201 to 400 words", async () => {
      const text250 = Array.from({ length: 250 }, (_, i) => `item${i}`).join(
        " ",
      );
      render(
        <StoryRichTextEditor
          value={`<p>${text250}</p>`}
          onChange={jest.fn()}
          preview={false}
        />,
      );

      await screen.findByRole("textbox", { name: "Story content" });
      expect(screen.getByText("250 words")).toBeInTheDocument();
      expect(screen.getByText("250 words total")).toBeInTheDocument();
      expect(screen.getByText("2 min read")).toBeInTheDocument();
    });

    it("displays '0 min read' for empty document", async () => {
      render(
        <StoryRichTextEditor value="" onChange={jest.fn()} preview={false} />,
      );

      await screen.findByRole("textbox", { name: "Story content" });
      expect(screen.getByText("0 words")).toBeInTheDocument();
      expect(screen.getByText("0 words total")).toBeInTheDocument();
      expect(screen.getByText("0 min read")).toBeInTheDocument();
    });
  });
});
