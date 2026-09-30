"use client";

import { contentRequest } from "../api/content.api";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import RichTextEditor from "./rich-text-editor";
import {
  RotateCcw,
  Eye,
  PenSquare,
  Layers,
  MoreVertical,
  Edit2,
  Trash2,
  EyeOff,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  Plus,
  MapPin,
  HelpCircle,
  ChevronRight,
  UploadCloud,
} from "lucide-react";

import { useStories } from "../hooks/use-content";
import Image from "next/image";
import type { FAQ, ServiceLine, ShipmentStory } from "../types";

export default function RealShipmentStoriesPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  // Data states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active action menu dropdown ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Image upload states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    metaDescription: "",
    content: "",
    pickupLocation: "",
    destination: "",
    shipmentType: "Classic & Exotic",
    serviceLine: "" as ServiceLine | "",
    shipmentStatus: "pending" as
      "pending" | "in_transit" | "delivered" | "cancelled",
    image: "",
    imageAlt: "",
    isPublished: true,
    faqs: [] as FAQ[],
  });

  // Close active dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = useStories(currentPage, Boolean(token));
  const stories = query.data?.data || [];
  const totalStoriesCount = query.data?.pagination?.total || 0;
  const loading = query.isPending;
  const error = query.error?.message;
  const fetchStories = () => query.refetch();

  // Calculations for stats
  const publishedStoriesCount = stories.filter((s) => s.isPublished).length;
  const draftStoriesCount = stories.filter((s) => !s.isPublished).length;
  const totalCountDisplay = totalStoriesCount || stories.length;

  // Format date: "Aug 02, 2026"
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Aug 02, 2026";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Aug 02, 2026";
    }
  };

  // Truncate text with ellipsis
  const truncate = (str: string, maxLen: number) => {
    if (!str) return "";
    return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;
  };

  // Handle open Add Modal
  const handleOpenAdd = () => {
    setModalMode("add");
    setCurrentId(null);
    setModalError(null);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    setFormData({
      title: "",
      slug: "",
      metaDescription: "",
      content: "",
      pickupLocation: "",
      destination: "",
      shipmentType: "Classic & Exotic",
      serviceLine: "",
      shipmentStatus: "delivered",
      image: "",
      imageAlt: "",
      isPublished: true,
      faqs: [],
    });
    setIsModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEdit = (story: ShipmentStory) => {
    setActiveMenuId(null);
    setModalMode("edit");
    setCurrentId(story._id);
    setModalError(null);
    setSelectedImageFile(null);
    setImagePreviewUrl(story.image || null);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    setFormData({
      title: story.title || "",
      slug: story.slug || "",
      metaDescription: story.metaDescription || "",
      content: story.content || "",
      pickupLocation: story.pickupLocation || "",
      destination: story.destination || "",
      shipmentType: story.shipmentType || "Classic & Exotic",
      serviceLine: story.serviceLine || "",
      shipmentStatus: story.shipmentStatus || "pending",
      image: story.image || "",
      imageAlt: story.imageAlt || "",
      isPublished: story.isPublished || false,
      faqs: story.faqs ? [...story.faqs] : [],
    });
    setIsModalOpen(true);
  };

  // Handle Cover Image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    setSelectedImageFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
  };

  // Handle Cover Image removal
  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setFormData((prev) => ({ ...prev, image: "" }));
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  };

  // Auto-slugify
  const handleTitleChange = (val: string) => {
    const slugified = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: modalMode === "add" ? slugified : prev.slug,
    }));
  };

  // Submit Modal with FormData supporting file uploads
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const strippedContent = formData.content.replace(/<[^>]*>/g, "").trim();
    const hasContent =
      strippedContent.length > 0 ||
      formData.content.includes("<Image unoptimized width={640} height={360}");

    if (
      !formData.title.trim() ||
      !formData.slug.trim() ||
      !formData.metaDescription.trim() ||
      !hasContent ||
      !formData.pickupLocation.trim() ||
      !formData.destination.trim() ||
      !formData.shipmentType.trim() ||
      !formData.serviceLine
    ) {
      setModalError(
        "Please complete all required fields including story content.",
      );
      return;
    }

    setModalLoading(true);

    try {
      const url =
        modalMode === "add"
          ? `/api/v1/real-shipment-stories`
          : `/api/v1/real-shipment-stories/${currentId}`;

      const method = modalMode === "add" ? "POST" : "PUT";

      // Build multipart FormData
      const submitData = new FormData();
      submitData.append("title", formData.title.trim());
      submitData.append("slug", formData.slug.trim());
      submitData.append("metaDescription", formData.metaDescription.trim());
      submitData.append("content", formData.content.trim());
      submitData.append("pickupLocation", formData.pickupLocation.trim());
      submitData.append("destination", formData.destination.trim());
      submitData.append("shipmentType", formData.shipmentType.trim());
      submitData.append("serviceLine", formData.serviceLine);
      submitData.append("shipmentStatus", formData.shipmentStatus);
      submitData.append("isPublished", String(formData.isPublished));

      submitData.append("imageAlt", formData.imageAlt.trim());

      if (selectedImageFile) {
        submitData.append("image", selectedImageFile);
      } else {
        submitData.append("image", formData.image);
      }

      const cleanFaqs = formData.faqs.filter(
        (f) => f.question.trim() && f.answer.trim(),
      );

      submitData.append("faqs", JSON.stringify(cleanFaqs));

      const res = await contentRequest(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setIsModalOpen(false);
        setSuccessMsg(
          modalMode === "add"
            ? "Story created successfully with cover image!"
            : "Story updated successfully!",
        );
        setTimeout(() => setSuccessMsg(null), 3500);
        fetchStories();
      } else {
        setModalError(json.message || "Failed to save story.");
      }
    } catch (err: unknown) {
      setModalError(
        err instanceof Error
          ? err.message
          : "An error occurred while saving the story.",
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle publish
  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setActiveMenuId(null);
    try {
      const res = await contentRequest(
        `/api/v1/real-shipment-stories/${id}/publish`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isPublished: !currentStatus }),
        },
      );

      const json = await res.json();
      if (res.ok && json.success) {
        await fetchStories();
        setSuccessMsg(
          !currentStatus ? "Story published!" : "Story moved to drafts.",
        );
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(json.message || "Failed to update publication status.");
      }
    } catch {
      alert("Error updating publish status.");
    }
  };

  // Delete story
  const handleDeleteStory = async (id: string, title: string) => {
    setActiveMenuId(null);
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await contentRequest(`/api/v1/real-shipment-stories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (stories.length === 1 && currentPage > 1)
          setCurrentPage(currentPage - 1);
        else await fetchStories();
        setSuccessMsg("Story deleted successfully.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(json.message || "Failed to delete story.");
      }
    } catch {
      alert("Error deleting story.");
    }
  };

  // FAQ handlers
  const addFAQ = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const updateFAQ = (
    index: number,
    field: "question" | "answer",
    val: string,
  ) => {
    setFormData((prev) => {
      const copy = [...prev.faqs];
      copy[index][field] = val;
      return { ...prev, faqs: copy };
    });
  };

  const removeFAQ = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalCountDisplay / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCountDisplay);

  return (
    <div className="space-y-8 sm:space-y-10 w-full pb-12">
      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Stat Cards Row (4 cards matching screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {/* Card 1: Active Stories */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Active Stories
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {String(publishedStoriesCount)}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Published on this page
            </p>
          </div>
        </div>

        {/* Card 2: Stories on this page */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Stories on this page
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {stories.length}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Current page
            </p>
          </div>
        </div>

        {/* Card 3: Draft Stories */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Draft Stories
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <PenSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {String(draftStoriesCount)}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Drafts on this page
            </p>
          </div>
        </div>

        {/* Card 4: Total Stories */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Total Stories
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {String(totalCountDisplay)}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              All created stories
            </p>
          </div>
        </div>
      </div>

      {/* 2. Story Library Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Story Library
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Create, publish, and manage verified auto transport stories.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#0c2340] hover:bg-[#081a33] text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Story</span>
        </button>
      </div>

      {/* 3. Shipment stories Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Card Title */}
        <div className="px-8 pt-6 pb-4">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Shipment stories
          </h3>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0c2340] mx-auto" />
            <p className="text-xs font-medium text-slate-400">
              Loading shipment stories...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchStories}
              className="text-xs font-semibold text-[#0c2340] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : stories.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              No stories found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Get started by creating your first real shipment story.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 text-xs font-semibold px-4 py-2 bg-[#0c2340] text-white rounded-lg"
            >
              Add First Story
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-y border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-8">STORY</th>
                  <th className="py-3.5 px-8">ROUTE</th>
                  <th className="py-3.5 px-8">CATEGORY</th>
                  <th className="py-3.5 px-8">DATE</th>
                  <th className="py-3.5 px-8 text-center">STATUS</th>
                  <th className="py-3.5 px-8 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {stories.map((story) => {
                  const isMenuOpen = activeMenuId === story._id;

                  return (
                    <tr
                      key={story._id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Story */}
                      <td className="py-4.5 px-8 font-medium text-slate-900 max-w-[220px]">
                        <span className="truncate block" title={story.title}>
                          {truncate(story.title, 34)}
                        </span>
                      </td>

                      {/* Route */}
                      <td className="py-4.5 px-8 text-slate-600 whitespace-nowrap">
                        <span>
                          {story.pickupLocation} → {story.destination}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-4.5 px-8 text-slate-600 whitespace-nowrap">
                        <span>{story.shipmentType || "Classic & Exotic"}</span>
                      </td>

                      {/* Date */}
                      <td className="py-4.5 px-8 text-slate-500 whitespace-nowrap">
                        {formatDate(story.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-4.5 px-8 text-center whitespace-nowrap">
                        {story.isPublished ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f7ef] text-[#128a52] border border-[#c3edd9]">
                            Published
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#f1f3f5] text-[#5c6873] border border-[#e1e5e8]">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4.5 px-8 text-right whitespace-nowrap relative">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() =>
                              setActiveMenuId(isMenuOpen ? null : story._id)
                            }
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                            >
                              <button
                                onClick={() => handleOpenEdit(story)}
                                className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit Story</span>
                              </button>

                              <button
                                onClick={() =>
                                  handleTogglePublish(
                                    story._id,
                                    story.isPublished,
                                  )
                                }
                                className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                {story.isPublished ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Move to Draft</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700 font-semibold">
                                      Publish
                                    </span>
                                  </>
                                )}
                              </button>

                              <div className="my-1 border-t border-slate-100" />

                              <button
                                onClick={() =>
                                  handleDeleteStory(story._id, story.title)
                                }
                                className="w-full px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Story</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination Footer (matching screenshot) */}
        <div className="px-8 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-slate-400 font-medium">
            Showing{" "}
            {totalCountDisplay === 0 ? "0" : `${startIndex}-${endIndex}`} of{" "}
            {totalCountDisplay} stories
          </p>

          <div className="flex items-center gap-1.5">
            {/* Page 1 */}
            <button
              onClick={() => setCurrentPage(1)}
              className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                currentPage === 1
                  ? "bg-[#0c2340] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              1
            </button>

            {/* Page 2 */}
            {totalPages >= 2 && (
              <button
                onClick={() => setCurrentPage(2)}
                className={`w-8 h-8 rounded-lg font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 2
                    ? "bg-[#0c2340] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                2
              </button>
            )}

            {/* Page 3 */}
            {totalPages >= 3 && (
              <button
                onClick={() => setCurrentPage(3)}
                className={`w-8 h-8 rounded-lg font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 3
                    ? "bg-[#0c2340] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                3
              </button>
            )}

            {/* Next Button */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage >= totalPages}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs ml-1 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Create / Edit Story Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#f8fafc]">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === "add" ? "Create New Story" : "Edit Story"}
                </h3>
                <p className="text-xs text-slate-400">
                  Fill in the details to publish on Car Carrier Group website
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{modalError}</div>
                </div>
              )}

              <form
                id="storyForm"
                onSubmit={handleSubmitForm}
                className="space-y-4"
              >
                {/* Title & Slug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Story Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. Moving a Classic Vehicle Across State"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      URL Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: e.target.value.toLowerCase(),
                        })
                      }
                      placeholder="e.g. moving-a-classic-vehicle-across-state"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Pickup & Destination */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pickup Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={formData.pickupLocation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pickupLocation: e.target.value,
                          })
                        }
                        placeholder="e.g. Texas"
                        className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Destination <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={formData.destination}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            destination: e.target.value,
                          })
                        }
                        placeholder="e.g. Florida"
                        className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipment Type (Category) & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Category / Shipment Type{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.shipmentType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipmentType: e.target.value,
                        })
                      }
                      placeholder="e.g. Classic & Exotic / Vintage Bikes"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Service line <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.serviceLine}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceLine: e.target.value as ServiceLine,
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                    >
                      <option value="">Choose a service line</option>
                      <option value="vehicle">Vehicle shipping</option>
                      <option value="freight">Freight</option>
                      <option value="heavy-equipment">Heavy equipment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Shipment Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.shipmentStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipmentStatus: e.target
                            .value as ShipmentStory["shipmentStatus"],
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                    >
                      <option value="delivered">Delivered</option>
                      <option value="in_transit">In Transit</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Cover Image Upload & Alt Text */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      Cover / Featured Image
                    </label>

                    {/* Hidden file input for cover image */}
                    <input
                      type="file"
                      ref={coverFileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />

                    {imagePreviewUrl ? (
                      /* Selected / Existing Image Preview Box */
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 w-full sm:w-auto">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 relative">
                            <Image
                              unoptimized
                              width={640}
                              height={360}
                              src={imagePreviewUrl}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate max-w-xs">
                              {selectedImageFile
                                ? selectedImageFile.name
                                : "Current Cover Image"}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {selectedImageFile
                                ? `${(selectedImageFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload`
                                : "Stored in Cloudinary"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                          <button
                            type="button"
                            onClick={() => coverFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            Change Image
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop / Click Upload Box */
                      <div
                        onClick={() => coverFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-[#0c2340] bg-slate-50/60 hover:bg-slate-50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#0c2340] group-hover:border-[#0c2340]/40 transition-colors shadow-2xs">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700">
                            <span className="text-[#0c2340] font-bold underline">
                              Click to upload cover image
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            PNG, JPG, WEBP or GIF (Auto-uploaded to Cloudinary)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Image Alt Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.imageAlt}
                      onChange={(e) =>
                        setFormData({ ...formData, imageAlt: e.target.value })
                      }
                      placeholder="e.g. Classic vehicle secured on transport carrier"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Meta Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metaDescription: e.target.value,
                      })
                    }
                    placeholder="Short SEO snippet description..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                  />
                </div>

                {/* Content Rich Text Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-slate-700">
                      Story Content (Rich Text Editor){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Full formatting: headings, lists, quotes, links & inline
                      image uploads
                    </span>
                  </div>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(html) =>
                      setFormData((prev) => ({ ...prev, content: html }))
                    }
                    placeholder="Write detailed story content, transit route details, client review, and embed pictures..."
                    token={token}
                  />
                </div>

                {/* FAQs */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1 text-slate-700 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5 text-[#0c2340]" />
                      <span>Story FAQs (Optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={addFAQ}
                      className="text-xs font-semibold text-[#0c2340] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add FAQ</span>
                    </button>
                  </div>

                  {formData.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mb-2"
                    >
                      <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                        <span>FAQ #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFAQ(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) =>
                          updateFAQ(idx, "question", e.target.value)
                        }
                        placeholder="Question..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                      />
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) =>
                          updateFAQ(idx, "answer", e.target.value)
                        }
                        placeholder="Answer..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                      />
                    </div>
                  ))}
                </div>

                {/* Publish Toggle */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">
                      Publish Story
                    </p>
                    <p className="text-[11px] text-slate-400">
                      When published, story appears on the public website.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isPublished: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0c2340]"></div>
                  </label>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-[#f8fafc] flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={modalLoading}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="storyForm"
                disabled={modalLoading}
                className="inline-flex items-center gap-2 px-5 py-2 font-semibold text-white bg-[#0c2340] hover:bg-[#081a33] rounded-lg cursor-pointer shadow-xs disabled:opacity-70"
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>
                    {modalMode === "add" ? "Create Story" : "Save Changes"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
