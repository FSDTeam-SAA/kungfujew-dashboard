"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Clock,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Quote,
  Redo2,
  Sparkles,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { requestErrorMessage } from "@/features/dashboard/components/request-error";
import { uploadStoryImage } from "../api/stories.api";

interface StoryRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  preview: boolean;
}

const imageTypes = /^image\/(jpeg|png|webp|gif|avif)$/;
const maxImageSize = 10 * 1024 * 1024;

function httpUrl(value: string, httpsOnly = false): string | null {
  try {
    const url = new URL(value.trim());
    return (
      httpsOnly
        ? url.protocol === "https:"
        : ["http:", "https:"].includes(url.protocol)
    )
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function calculateReadingTime(words: number): string {
  if (words === 0) return "0 min read";
  if (words < 200) return "< 1 min read";
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-[#d7deea]" />;
}

function ToolButton({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#012055] disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-[#012055] text-white"
          : "text-[#34445f] hover:bg-[#e8edf4]",
      )}
    >
      {icon}
    </button>
  );
}

export function StoryRichTextEditor({
  value,
  onChange,
  error,
  preview,
}: StoryRichTextEditorProps) {
  const lastEmittedHtml = useRef(value);
  const selection = useRef({ from: 0, to: 0 });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkHasSelection, setLinkHasSelection] = useState(false);
  const [linkWasActive, setLinkWasActive] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageError, setImageError] = useState("");
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, defaultProtocol: "https" },
        underline: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({ allowBase64: false }),
      Table,
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: "Tell the shipment story…" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id: "content",
        role: "textbox",
        "aria-label": "Story content",
        "aria-multiline": "true",
        "aria-describedby": "story-content-hint",
        class:
          "prose prose-slate mx-auto min-h-[22rem] max-w-[70ch] px-5 py-7 text-[15px] leading-7 text-[#25324a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#012055] sm:px-9 sm:py-10",
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.isEmpty ? "" : current.getHTML();
      lastEmittedHtml.current = html;
      onChange(html);
    },
    onBlur: ({ editor: current }) => {
      const html = current.isEmpty ? "" : current.getHTML();
      lastEmittedHtml.current = html;
      onChange(html);
    },
  });

  const flushEmittedHtml = (current: typeof editor) => {
    if (!current) return;
    const html = current.isEmpty ? "" : current.getHTML();
    lastEmittedHtml.current = html;
    onChange(html);
  };

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const text = current?.getText() ?? "";
      const words = text.trim() ? (text.match(/\S+/g) || []).length : 0;
      const chars = text.length;
      return {
        words,
        chars,
        readingTime: calculateReadingTime(words),
        block: current?.isActive("heading", { level: 1 })
          ? "h1"
          : current?.isActive("heading", { level: 2 })
            ? "h2"
            : current?.isActive("heading", { level: 3 })
              ? "h3"
              : "paragraph",
        bold: current?.isActive("bold") ?? false,
        italic: current?.isActive("italic") ?? false,
        underline: current?.isActive("underline") ?? false,
        strike: current?.isActive("strike") ?? false,
        alignLeft: current?.isActive({ textAlign: "left" }) ?? false,
        alignCenter: current?.isActive({ textAlign: "center" }) ?? false,
        alignRight: current?.isActive({ textAlign: "right" }) ?? false,
        bulletList: current?.isActive("bulletList") ?? false,
        orderedList: current?.isActive("orderedList") ?? false,
        blockquote: current?.isActive("blockquote") ?? false,
        link: current?.isActive("link") ?? false,
        table: current?.isActive("table") ?? false,
        undo: current?.can().undo() ?? false,
        redo: current?.can().redo() ?? false,
      };
    },
  });

  // Parent echoes must not reset selection or overwrite active typing.
  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    if (value === lastEmittedHtml.current) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    lastEmittedHtml.current = value;
  }, [editor, value]);

  useEffect(() => {
    if (editor) editor.setEditable(!preview);
  }, [editor, preview]);

  // Adjust ProseMirror layout classes based on fullscreen state
  useEffect(() => {
    if (!editor) return;
    const props = editor.options.editorProps;
    const attributes =
      typeof props.attributes === "function"
        ? props.attributes(editor.state)
        : props.attributes;
    editor.setOptions({
      editorProps: {
        ...props,
        attributes: {
          ...attributes,
          class: isFullscreen
            ? "prose prose-slate max-w-none min-h-[calc(100vh-220px)] text-[16px] leading-8 text-[#25324a] focus-visible:outline-2 focus-visible:outline-[#012055]"
            : "prose prose-slate mx-auto min-h-[22rem] max-w-[70ch] px-5 py-7 text-[15px] leading-7 text-[#25324a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#012055] sm:px-9 sm:py-10",
        },
      },
    });
  }, [editor, isFullscreen]);

  // Body scroll lock and Escape key listener for distraction-free fullscreen mode
  useEffect(() => {
    if (!isFullscreen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (linkOpen || imageOpen) return;
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, linkOpen, imageOpen]);

  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute(
      "aria-describedby",
      error ? "story-content-hint content-error" : "story-content-hint",
    );
    if (error) editor.view.dom.setAttribute("aria-invalid", "true");
    else editor.view.dom.removeAttribute("aria-invalid");
  }, [editor, error]);

  const openLink = () => {
    if (!editor) return;
    const wasActive = editor.isActive("link");
    if (wasActive) editor.chain().focus().extendMarkRange("link").run();
    selection.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };
    setLinkHasSelection(selection.current.from !== selection.current.to);
    setLinkWasActive(wasActive);
    setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkText(
      editor.state.doc.textBetween(
        selection.current.from,
        selection.current.to,
      ),
    );
    setLinkError("");
    setLinkOpen(true);
  };

  const saveLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!editor) return;
    const url = httpUrl(linkUrl);
    if (!url) {
      setLinkError("Enter an HTTP or HTTPS link.");
      return;
    }
    const { from, to } = selection.current;
    if (from === to) {
      editor
        .chain()
        .focus()
        .setTextSelection(from)
        .insertContent({
          type: "text",
          text: linkText.trim() || url,
          marks: [{ type: "link", attrs: { href: url } }],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setLinkOpen(false);
    flushEmittedHtml(editor);
  };

  const removeLink = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setTextSelection(selection.current)
      .extendMarkRange("link")
      .unsetLink()
      .run();
    setLinkOpen(false);
    flushEmittedHtml(editor);
  };

  const openImage = () => {
    if (!editor) return;
    selection.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };
    setImageFile(null);
    setImageUrl("");
    setImageAlt("");
    setImageError("");
    setImageMode("upload");
    setImageOpen(true);
  };

  const addImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!editor) return;
    const alt = imageAlt.trim();
    if (!alt) {
      setImageError("Describe the image for readers.");
      return;
    }
    let src: string;
    if (imageMode === "upload") {
      if (
        !imageFile ||
        !imageTypes.test(imageFile.type) ||
        imageFile.size > maxImageSize
      ) {
        setImageError(
          "Choose a JPEG, PNG, WebP, GIF or AVIF image up to 10 MiB.",
        );
        return;
      }
      setUploading(true);
      setImageError("");
      try {
        src = await uploadStoryImage(imageFile);
      } catch (uploadError) {
        setImageError(requestErrorMessage(uploadError));
        setUploading(false);
        return;
      }
      setUploading(false);
    } else {
      const url = httpUrl(imageUrl, true);
      if (!url) {
        setImageError("Enter an HTTPS image URL.");
        return;
      }
      src = url;
    }
    if (editor.isDestroyed) return;
    editor
      .chain()
      .focus()
      .setTextSelection(selection.current.from)
      .setImage({ src, alt })
      .run();
    setImageOpen(false);
    flushEmittedHtml(editor);
  };

  return (
    <div className={preview ? "" : "space-y-3"}>
      {!preview ? (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1d2b4f]">
              Story body
            </h3>
            <p id="story-content-hint" className="mt-1 text-xs text-[#59677c]">
              Build the narrative with headings, images and clear sections.
            </p>
          </div>
          <span className="text-xs tabular-nums text-[#59677c]">
            {state?.words ?? 0} words
          </span>
        </div>
      ) : (
        <p id="story-content-hint" className="sr-only">
          Preview of the unsaved story body
        </p>
      )}

      <div
        className={cn(
          isFullscreen
            ? "fixed inset-0 z-50 flex h-screen w-screen flex-col bg-[#f8fafc] text-[#1d2b4f] overflow-hidden antialiased"
            : cn(
                "overflow-hidden rounded-xl border bg-white",
                error ? "border-red-500" : "border-[#d7deea]",
                !preview && "shadow-[0_12px_36px_rgba(1,32,85,0.05)]",
              ),
        )}
      >
        {!preview && editor && (
          <BubbleMenu
            editor={editor}
            options={{
              placement: "top",
              offset: 8,
            }}
            shouldShow={({ view, state: editorState, from, to, element }) => {
              const { doc, selection: currentSelection } = editorState;
              const isEmptyTextBlock = !doc.textBetween(from, to).length;
              const isChildOfMenu =
                typeof document !== "undefined" &&
                Boolean(element?.contains(document.activeElement));
              const hasEditorFocus = view.hasFocus() || isChildOfMenu;
              return (
                !currentSelection.empty &&
                !isEmptyTextBlock &&
                Boolean(hasEditorFocus) &&
                editor.isEditable
              );
            }}
            className="flex items-center gap-0.5 rounded-lg border border-[#d7deea] bg-white p-1 shadow-xl"
            aria-label="Inline text formatting"
          >
            <button
              type="button"
              aria-label="Heading 1"
              aria-pressed={state?.block === "h1"}
              title="Heading 1"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={cn(
                "inline-flex size-7 items-center justify-center rounded text-xs font-bold transition-colors",
                state?.block === "h1"
                  ? "bg-[#012055] text-white"
                  : "text-[#34445f] hover:bg-[#e8edf4]",
              )}
            >
              H1
            </button>
            <button
              type="button"
              aria-label="Heading 2"
              aria-pressed={state?.block === "h2"}
              title="Heading 2"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={cn(
                "inline-flex size-7 items-center justify-center rounded text-xs font-bold transition-colors",
                state?.block === "h2"
                  ? "bg-[#012055] text-white"
                  : "text-[#34445f] hover:bg-[#e8edf4]",
              )}
            >
              H2
            </button>
            <button
              type="button"
              aria-label="Heading 3"
              aria-pressed={state?.block === "h3"}
              title="Heading 3"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={cn(
                "inline-flex size-7 items-center justify-center rounded text-xs font-bold transition-colors",
                state?.block === "h3"
                  ? "bg-[#012055] text-white"
                  : "text-[#34445f] hover:bg-[#e8edf4]",
              )}
            >
              H3
            </button>

            <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[#d7deea]" />

            <button
              type="button"
              aria-label="Bold"
              aria-pressed={state?.bold}
              title="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded transition-colors",
                state?.bold
                  ? "bg-[#012055] text-white"
                  : "text-[#34445f] hover:bg-[#e8edf4]",
              )}
            >
              <Bold className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Italic"
              aria-pressed={state?.italic}
              title="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded transition-colors",
                state?.italic
                  ? "bg-[#012055] text-white"
                  : "text-[#34445f] hover:bg-[#e8edf4]",
              )}
            >
              <Italic className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Underline"
              aria-pressed={state?.underline}
              title="Underline"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded transition-colors",
                state?.underline
                  ? "bg-[#012055] text-white"
                  : "text-[#34445f] hover:bg-[#e8edf4]",
              )}
            >
              <UnderlineIcon className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Strikethrough"
              aria-pressed={state?.strike}
              title="Strikethrough"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded transition-colors",
                state?.strike
                  ? "bg-[#012055] text-white"
                  : "text-[#34445f] hover:bg-[#e8edf4]",
              )}
            >
              <Strikethrough className="size-3.5" />
            </button>

            <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[#d7deea]" />

            <button
              type="button"
              aria-label="Link"
              aria-pressed={state?.link}
              title="Link"
              onClick={openLink}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded transition-colors",
                state?.link
                  ? "bg-[#012055] text-white"
                  : "text-[#34445f] hover:bg-[#e8edf4]",
              )}
            >
              <Link2 className="size-3.5" />
            </button>
          </BubbleMenu>
        )}

        {!preview && editor && (
          <div className="sticky top-0 z-20 border-b border-[#e0e6ee] bg-[#f6f8fb] px-3 py-2 sm:px-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                className="flex flex-wrap items-center gap-1"
                aria-label="Story formatting controls"
              >
                {/* Group 1: History */}
                <ToolButton
                  label="Undo"
                  icon={<Undo2 className="size-4" />}
                  disabled={!state?.undo}
                  onClick={() => editor.chain().focus().undo().run()}
                />
                <ToolButton
                  label="Redo"
                  icon={<Redo2 className="size-4" />}
                  disabled={!state?.redo}
                  onClick={() => editor.chain().focus().redo().run()}
                />

                <ToolbarDivider />

                {/* Group 2: Text Style */}
                <label className="sr-only" htmlFor="story-block-style">
                  Text style
                </label>
                <select
                  id="story-block-style"
                  value={state?.block ?? "paragraph"}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (next === "paragraph")
                      editor.chain().focus().setParagraph().run();
                    else
                      editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: Number(next[1]) as 1 | 2 | 3 })
                        .run();
                  }}
                  className="h-10 rounded-md border border-[#d7deea] bg-white px-3 text-sm font-medium text-[#1d2b4f] focus-visible:outline-2 focus-visible:outline-[#012055]"
                >
                  <option value="paragraph">Paragraph</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                </select>

                <ToolbarDivider />

                {/* Group 3: Formatting */}
                <ToolButton
                  label="Bold"
                  icon={<Bold className="size-4" />}
                  active={state?.bold}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolButton
                  label="Italic"
                  icon={<Italic className="size-4" />}
                  active={state?.italic}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolButton
                  label="Underline"
                  icon={<UnderlineIcon className="size-4" />}
                  active={state?.underline}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                />
                <ToolButton
                  label="Strikethrough"
                  icon={<Strikethrough className="size-4" />}
                  active={state?.strike}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                />

                <ToolbarDivider />

                {/* Group 4: Alignment & Lists */}
                <ToolButton
                  label="Align left"
                  icon={<AlignLeft className="size-4" />}
                  active={state?.alignLeft}
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                />
                <ToolButton
                  label="Align center"
                  icon={<AlignCenter className="size-4" />}
                  active={state?.alignCenter}
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                />
                <ToolButton
                  label="Align right"
                  icon={<AlignRight className="size-4" />}
                  active={state?.alignRight}
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                />
                <ToolButton
                  label="Bullet list"
                  icon={<List className="size-4" />}
                  active={state?.bulletList}
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                />
                <ToolButton
                  label="Numbered list"
                  icon={<ListOrdered className="size-4" />}
                  active={state?.orderedList}
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                />
                <ToolButton
                  label="Quote"
                  icon={<Quote className="size-4" />}
                  active={state?.blockquote}
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                />
                <ToolButton
                  label="Divider"
                  icon={<Minus className="size-4" />}
                  onClick={() =>
                    editor.chain().focus().setHorizontalRule().run()
                  }
                />

                <ToolbarDivider />

                {/* Group 5: Media & Links */}
                <ToolButton
                  label="Link"
                  icon={<Link2 className="size-4" />}
                  active={state?.link}
                  onClick={openLink}
                />
                <ToolButton
                  label="Image"
                  icon={<ImagePlus className="size-4" />}
                  onClick={openImage}
                />
                <ToolButton
                  label="Insert table"
                  icon={<Table2 className="size-4" />}
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run()
                  }
                />

                <ToolbarDivider />

                {/* Group 6: Fullscreen Toggle */}
                <ToolButton
                  label={isFullscreen ? "Exit fullscreen" : "Fullscreen mode"}
                  icon={
                    isFullscreen ? (
                      <Minimize2 className="size-4" />
                    ) : (
                      <Maximize2 className="size-4" />
                    )
                  }
                  active={isFullscreen}
                  onClick={() => setIsFullscreen((prev) => !prev)}
                />
              </div>

              {isFullscreen && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                  className="border-[#d7deea] bg-white text-xs text-[#1d2b4f] hover:bg-[#e8edf4]"
                >
                  <Minimize2 className="mr-1.5 size-3.5" /> Exit fullscreen
                  (Esc)
                </Button>
              )}
            </div>

            {state?.table && (
              <div
                className="mt-2 flex flex-wrap items-center gap-1 border-t border-[#e0e6ee] pt-2"
                aria-label="Table controls"
              >
                <span className="px-2 text-xs font-semibold text-[#59677c]">
                  Table
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                >
                  Add row
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                >
                  Add column
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                >
                  Delete row
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                >
                  Delete column
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                >
                  Delete table
                </Button>
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex-1",
            isFullscreen
              ? "overflow-y-auto px-4 py-8 sm:px-12"
              : preview
                ? "bg-white"
                : "bg-[#fffefd]",
          )}
        >
          <div
            className={cn(
              isFullscreen &&
                "mx-auto max-w-4xl rounded-xl border border-[#e2e8f0] bg-white px-8 py-10 shadow-lg sm:px-16 sm:py-14",
            )}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {!preview && (
          <div className="flex flex-wrap items-center justify-between border-t border-[#e0e6ee] bg-[#f8fafc] px-4 py-2 text-xs text-[#59677c]">
            <div className="flex items-center gap-2">
              {isFullscreen ? (
                <span className="inline-flex items-center gap-1 font-medium text-[#1d2b4f]">
                  <Sparkles
                    className="size-3 text-[#ff8b36]"
                    aria-hidden="true"
                  />{" "}
                  Distraction-Free Canvas
                </span>
              ) : (
                <span className="text-[#59677c]">
                  Markdown shortcuts & rich formatting enabled
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span className="font-medium text-[#1d2b4f]">
                {state?.words ?? 0} words total
              </span>
              <span aria-hidden="true" className="text-[#cbd5e1]">
                ·
              </span>
              <span>{state?.chars ?? 0} characters</span>
              <span aria-hidden="true" className="text-[#cbd5e1]">
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3 text-[#59677c]" aria-hidden="true" />
                {state?.readingTime ?? "0 min read"}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p id="content-error" role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add or edit link</DialogTitle>
            <DialogDescription>
              Use a full HTTP or HTTPS address.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveLink} noValidate className="space-y-4">
            {!linkHasSelection && (
              <div>
                <label
                  htmlFor="story-link-text"
                  className="text-sm font-medium text-[#1d2b4f]"
                >
                  Link text
                </label>
                <Input
                  id="story-link-text"
                  value={linkText}
                  onChange={(event) => setLinkText(event.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="story-link-url"
                className="text-sm font-medium text-[#1d2b4f]"
              >
                URL
              </label>
              <Input
                id="story-link-url"
                type="url"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://example.com"
                className="mt-1"
                aria-invalid={Boolean(linkError)}
                aria-describedby={linkError ? "story-link-error" : undefined}
              />
              {linkError && (
                <p
                  id="story-link-error"
                  role="alert"
                  className="mt-1 text-sm text-red-700"
                >
                  {linkError}
                </p>
              )}
            </div>
            <DialogFooter>
              {linkWasActive && (
                <Button type="button" variant="outline" onClick={removeLink}>
                  Remove link
                </Button>
              )}
              <Button
                type="submit"
                className="bg-[#012055] text-white hover:bg-[#1d2b4f]"
              >
                Save link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={imageOpen}
        onOpenChange={(open) => {
          if (!uploading) setImageOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert image</DialogTitle>
            <DialogDescription>
              Use an uploaded image or an HTTPS address. Alt text is required.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2" role="group" aria-label="Image source">
            <Button
              type="button"
              variant={imageMode === "upload" ? "secondary" : "outline"}
              aria-pressed={imageMode === "upload"}
              onClick={() => {
                setImageMode("upload");
                setImageError("");
              }}
            >
              Upload file
            </Button>
            <Button
              type="button"
              variant={imageMode === "url" ? "secondary" : "outline"}
              aria-pressed={imageMode === "url"}
              onClick={() => {
                setImageMode("url");
                setImageError("");
              }}
            >
              Use URL
            </Button>
          </div>
          <form
            onSubmit={(event) => void addImage(event)}
            noValidate
            className="space-y-4"
          >
            {imageMode === "upload" ? (
              <div>
                <label
                  htmlFor="story-inline-file"
                  className="text-sm font-medium text-[#1d2b4f]"
                >
                  Image file
                </label>
                <Input
                  id="story-inline-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  onChange={(event) =>
                    setImageFile(event.target.files?.[0] ?? null)
                  }
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-[#59677c]">
                  JPEG, PNG, WebP, GIF or AVIF · up to 10 MiB
                </p>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="story-inline-url"
                  className="text-sm font-medium text-[#1d2b4f]"
                >
                  Image URL
                </label>
                <Input
                  id="story-inline-url"
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="story-inline-alt"
                className="text-sm font-medium text-[#1d2b4f]"
              >
                Alt text
              </label>
              <Input
                id="story-inline-alt"
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="Describe what the image shows"
                className="mt-1"
                aria-invalid={Boolean(imageError)}
                aria-describedby={imageError ? "story-image-error" : undefined}
              />
            </div>
            {imageError && (
              <p
                id="story-image-error"
                role="alert"
                className="mt-1 text-sm text-red-700"
              >
                {imageError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={uploading}
                className="bg-[#012055] text-white hover:bg-[#1d2b4f]"
              >
                {uploading ? "Uploading…" : "Insert image"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
