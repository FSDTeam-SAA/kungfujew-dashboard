"use client";

import { contentRequest } from "../api/content.api";

import React, { useRef, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Undo2,
  Redo2,
  Loader2,
  UploadCloud,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  token?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write full story content, transport conditions, client satisfaction...",
  token,
}: RichTextEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class:
            "rounded-xl my-4 max-w-full h-auto shadow-sm border border-slate-200",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#0c2340] underline font-medium hover:text-blue-700",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] max-h-[420px] overflow-y-auto px-4 py-3 text-xs sm:text-sm text-slate-800 focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  // Keep editor content in sync when modal opens with story data
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 bg-slate-50 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#0c2340]" />
        <span>Loading editor...</span>
      </div>
    );
  }

  // Handle image upload from computer
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so user can choose the same file again if needed
    e.target.value = "";

    setIsUploadingImage(true);
    try {
      if (token) {
        // Upload to backend Cloudinary endpoint
        const formData = new FormData();
        formData.append("image", file);

        const res = await contentRequest(
          `/api/v1/real-shipment-stories/upload-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        const data = await res.json();
        if (res.ok && data.success && data.url) {
          editor
            .chain()
            .focus()
            .setImage({ src: data.url, alt: file.name })
            .run();
          return;
        }
      }

      throw new Error("Image upload failed. Please try again.");
    } catch (err) {
      console.error("Failed to upload story inline image:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Add Link
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // Add Image by URL prompt
  const addImageByUrl = () => {
    const url = window.prompt("Enter Image URL (https://...):");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-[#0c2340] focus-within:border-transparent transition-all">
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 text-slate-600">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-md hover:bg-slate-200/70 disabled:opacity-30 cursor-pointer"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded-md hover:bg-slate-200/70 disabled:opacity-30 cursor-pointer"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`p-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors ${
            editor.isActive("heading", { level: 1 })
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`p-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors ${
            editor.isActive("heading", { level: 2 })
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`p-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors ${
            editor.isActive("heading", { level: 3 })
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

        {/* Text Styles */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive("bold")
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive("italic")
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive("underline")
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive("strike")
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

        {/* Alignments */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive({ textAlign: "left" })
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive({ textAlign: "center" })
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive({ textAlign: "right" })
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive("bulletList")
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive("orderedList")
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive("blockquote")
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Quote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-700 cursor-pointer"
          title="Horizontal Rule"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
            editor.isActive("link")
              ? "bg-[#0c2340] text-white shadow-xs"
              : "hover:bg-slate-200/70 text-slate-700"
          }`}
          title="Insert Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* Upload Image Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          title="Upload image from computer"
        >
          {isUploadingImage ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-[#0c2340]" />
              <span className="text-[11px]">Uploading...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5 text-[#0c2340]" />
              <span className="text-[11px]">Upload Image</span>
            </>
          )}
        </button>

        {/* Insert Image by URL */}
        <button
          type="button"
          onClick={addImageByUrl}
          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-700 cursor-pointer"
          title="Insert image by URL"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Content Canvas */}
      <EditorContent editor={editor} />
    </div>
  );
}
