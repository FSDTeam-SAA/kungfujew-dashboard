"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";

interface StoryRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "secondary" : "ghost"}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function StoryRichTextEditor({
  value,
  onChange,
  error,
}: StoryRichTextEditorProps) {
  const [preview, setPreview] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, defaultProtocol: "https" },
      }),
      Image,
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
          "prose prose-slate max-w-none min-h-56 px-4 py-3 focus-visible:outline-2 focus-visible:outline-[#1d2b4f]",
      },
    },
    onUpdate: ({ editor: current }) =>
      onChange(current.isEmpty ? "" : current.getHTML()),
  });

  useEffect(() => {
    if (editor && editor.isEditable === preview) editor.setEditable(!preview);
  }, [editor, preview]);

  const editLink = () => {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const entered = window.prompt(
      "Link URL (https://…)",
      current ?? "https://",
    );
    if (entered === null) return;
    if (!entered.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    try {
      const url = new URL(entered.trim());
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url.href })
        .run();
    } catch {
      window.alert("Enter an HTTP or HTTPS link.");
    }
  };

  const addImage = () => {
    if (!editor) return;
    const entered = window.prompt("Image URL (https://…)");
    if (!entered) return;
    try {
      const url = new URL(entered.trim());
      if (url.protocol !== "https:") throw new Error();
      const alt = window.prompt("Describe this image for readers")?.trim();
      if (!alt) return;
      editor.chain().focus().setImage({ src: url.href, alt }).run();
    } catch {
      window.alert("Enter an HTTPS image URL.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor="content"
          className="block text-sm font-medium text-[#1d2b4f]"
        >
          Content
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreview((current) => !current)}
          aria-pressed={preview}
        >
          {preview ? "Continue editing" : "Preview story text"}
        </Button>
      </div>
      <p id="story-content-hint" className="mb-2 text-xs text-[#535d70]">
        Format the story body, then preview it before publishing.
      </p>
      <div
        className="overflow-hidden rounded-md border border-[#cbd5e1] bg-white"
        aria-invalid={Boolean(error)}
      >
        {!preview && editor && (
          <div
            role="toolbar"
            aria-label="Story text formatting"
            className="flex flex-wrap gap-1 border-b bg-slate-50 p-2"
          >
            <ToolbarButton
              label="Paragraph"
              active={editor.isActive("paragraph")}
              onClick={() => editor.chain().focus().setParagraph().run()}
            />
            <ToolbarButton
              label="Heading 1"
              active={editor.isActive("heading", { level: 1 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            />
            <ToolbarButton
              label="Heading 2"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            />
            <ToolbarButton
              label="Heading 3"
              active={editor.isActive("heading", { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            />
            <ToolbarButton
              label="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <ToolbarButton
              label="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <ToolbarButton
              label="Underline"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
            <ToolbarButton
              label="Bullet list"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
            <ToolbarButton
              label="Numbered list"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
            <ToolbarButton
              label="Quote"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            />
            <ToolbarButton
              label="Link"
              active={editor.isActive("link")}
              onClick={editLink}
            />
            <ToolbarButton label="Image" onClick={addImage} />
            <ToolbarButton
              label="Table"
              active={editor.isActive("table")}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            />
            {editor.isActive("table") && (
              <ToolbarButton
                label="Add row"
                onClick={() => editor.chain().focus().addRowAfter().run()}
              />
            )}
            {editor.isActive("table") && (
              <ToolbarButton
                label="Add column"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              />
            )}
            {editor.isActive("table") && (
              <ToolbarButton
                label="Delete table"
                onClick={() => editor.chain().focus().deleteTable().run()}
              />
            )}
            <ToolbarButton
              label="Undo"
              onClick={() => editor.chain().focus().undo().run()}
            />
            <ToolbarButton
              label="Redo"
              onClick={() => editor.chain().focus().redo().run()}
            />
          </div>
        )}
        {preview && (
          <p
            role="status"
            className="border-b bg-slate-50 px-4 py-2 text-sm text-[#535d70]"
          >
            Preview of the unsaved story body
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
      {error && (
        <p
          id="content-error"
          role="alert"
          className="mt-1 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
