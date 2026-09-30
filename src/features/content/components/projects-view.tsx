"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  MoreVertical,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  Plus,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  createProject,
  updateProject,
  deleteProject,
  type Project,
} from "../api/projects.api";

import { useProjects } from "../hooks/use-content";

interface FormState {
  name: string;
  type: "web" | "app";
  category: string;
  profile: string;
  figmaLink: string;
  websiteLink: string;
  adminLink: string;
}

const emptyForm: FormState = {
  name: "",
  type: "web",
  category: "",
  profile: "",
  figmaLink: "",
  websiteLink: "",
  adminLink: "",
};

const projectTypes = ["web", "app"];
const categories = [
  "All",
  "Marketing Site",
  "E-commerce",
  "SaaS",
  "Mobile App",
  "Landing",
];

export default function ProjectsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);

  const itemsPerPage = 5;

  const query = useProjects(
    currentPage,
    search,
    categoryFilter,
    Boolean(token),
  );
  const projects = query.data?.data || [];
  const totalCount = query.data?.pagination.total || 0;
  const loading = query.isPending;
  const error = query.error?.message;
  const fetchProjectsData = () => query.refetch();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setCurrentId(null);
    setModalError(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setActiveMenuId(null);
    setModalMode("edit");
    setCurrentId(project._id);
    setModalError(null);
    setFormData({
      name: project.name || "",
      type: project.type || "web",
      category: project.category || "",
      profile: project.profile || "",
      figmaLink: project.figmaLink || "",
      websiteLink: project.websiteLink || "",
      adminLink: project.adminLink || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!formData.name.trim()) {
      setModalError("Project name is required.");
      return;
    }
    setModalLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        category: formData.category.trim(),
        profile: formData.profile.trim(),
        figmaLink: formData.figmaLink.trim(),
        websiteLink: formData.websiteLink.trim(),
        adminLink: formData.adminLink.trim(),
      };
      if (modalMode === "add") {
        await createProject(payload);
        triggerSuccess("Project created successfully!");
      } else {
        if (!currentId) throw new Error("Select a project to edit");
        await updateProject(currentId, payload);
        triggerSuccess("Project updated successfully!");
      }
      setIsModalOpen(false);
      await fetchProjectsData();
    } catch (err: unknown) {
      setModalError(
        err instanceof Error ? err.message : "An error occurred while saving.",
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) return;
    try {
      await deleteProject(project._id);
      triggerSuccess("Project deleted successfully.");
      if (projects.length === 1 && currentPage > 1)
        setCurrentPage(currentPage - 1);
      else await fetchProjectsData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting project.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);
  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      : "—";

  return (
    <div className="space-y-8 sm:space-y-10 w-full pb-12">
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <svg
              className="w-4 h-4 text-emerald-600 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-11.3a1 1 0 00-1.4-1.4L9 9.2 7.7 7.9a1 1 0 00-1.4 1.4l1.8 1.8a1 1 0 001.4 0l3.7-3.7z"
                clipRule="evenodd"
              />
            </svg>
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Projects
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage project catalog entries displayed on the website.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#0c2340] hover:bg-[#081a33] text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-8 pt-6 pb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search projects..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0c2340] mx-auto" />
            <p className="text-xs font-medium text-slate-400">
              Loading projects...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchProjectsData}
              className="text-xs font-semibold text-[#0c2340] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              No projects found
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 text-xs font-semibold px-4 py-2 bg-[#0c2340] text-white rounded-lg"
            >
              Add First Project
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-y border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-8">PROJECT</th>
                  <th className="py-3.5 px-8">TYPE</th>
                  <th className="py-3.5 px-8">CATEGORY</th>
                  <th className="py-3.5 px-8">LINKS</th>
                  <th className="py-3.5 px-8">DATE</th>
                  <th className="py-3.5 px-8 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {projects.map((project) => (
                  <tr
                    key={project._id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-4.5 px-8 font-medium text-slate-900 max-w-[220px]">
                      <span className="truncate block" title={project.name}>
                        {project.name}
                      </span>
                      {project.profile && (
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {project.profile}
                        </p>
                      )}
                    </td>
                    <td className="py-4.5 px-8 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${project.type === "app" ? "bg-[#eef2ff] text-[#4338ca]" : "bg-[#f1f3f5] text-[#475569]"}`}
                      >
                        {project.type === "app" ? "App" : "Web"}
                      </span>
                    </td>
                    <td className="py-4.5 px-8 text-slate-600 whitespace-nowrap">
                      {project.category || "—"}
                    </td>
                    <td className="py-4.5 px-8 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {project.websiteLink && (
                          <a
                            href={project.websiteLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0d2861] hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Site
                          </a>
                        )}
                        {project.figmaLink && (
                          <a
                            href={project.figmaLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Figma
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-4.5 px-8 text-slate-500 whitespace-nowrap">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="py-4.5 px-8 text-right whitespace-nowrap relative">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === project._id ? null : project._id,
                            )
                          }
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenuId === project._id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              onClick={() => handleOpenEdit(project)}
                              className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit Project</span>
                            </button>
                            <button
                              onClick={() => handleDelete(project)}
                              className="w-full px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Project</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-8 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-slate-400 font-medium">
            Showing {totalCount === 0 ? "0" : `${startIndex}-${endIndex}`} of{" "}
            {totalCount} projects
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:bg-slate-100"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#f8fafc]">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === "add" ? "Add Project" : "Edit Project"}
                </h3>
                <p className="text-xs text-slate-400">
                  Fill in the project details.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{modalError}</div>
                </div>
              )}

              <form
                id="projectForm"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Car Carrier Rebrand"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as "web" | "app",
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                    >
                      {projectTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                    >
                      <option value="">Select category</option>
                      {categories.slice(1).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Profile
                    </label>
                    <input
                      type="text"
                      value={formData.profile}
                      onChange={(e) =>
                        setFormData({ ...formData, profile: e.target.value })
                      }
                      placeholder="e.g. Full-stack redesign"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {["figmaLink", "websiteLink", "adminLink"].map((field) => (
                    <div key={field}>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {field
                          .replace(/Link$/, "")
                          .replace(/^\w/, (c) => c.toUpperCase())}{" "}
                        URL
                      </label>
                      <input
                        type="url"
                        value={formData[field as keyof FormState]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field]: e.target.value })
                        }
                        placeholder={
                          field === "figmaLink"
                            ? "https://figma.com/..."
                            : field === "websiteLink"
                              ? "https://example.com"
                              : "https://admin.example.com"
                        }
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2340] focus:bg-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100"></div>
              </form>
            </div>

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
                form="projectForm"
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
                    {modalMode === "add" ? "Add Project" : "Save Changes"}
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
