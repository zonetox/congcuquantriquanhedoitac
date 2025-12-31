"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit2, Save, X, Plus } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/categories/actions";
import { toast } from "sonner";
import type { Category } from "@/lib/categories/actions";
import { hasValidPremiumAccess } from "@/lib/membership";

interface ManageCategoriesProps {
  isPremium: boolean;
}

const COLOR_PRESETS = [
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#64748b", // Slate
  "#14b8a6", // Teal
];

export function ManageCategories({ isPremium }: ManageCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [creating, setCreating] = useState(false);
  const [hasValidPremium, setHasValidPremium] = useState(false);

  useEffect(() => {
    async function checkPremium() {
      const premium = await hasValidPremiumAccess();
      setHasValidPremium(premium);
    }
    checkPremium();
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    const result = await getCategories();
    if (result.error) {
      toast.error(result.error);
    } else {
      setCategories(result.data || []);
    }
    setLoading(false);
  }

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("#3b82f6");
  };

  const handleSaveEdit = async (categoryId: string) => {
    if (!editName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    const result = await updateCategory(categoryId, editName.trim(), editColor);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Category updated successfully!");
      setEditingId(null);
      loadCategories();
    }
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }

    const result = await deleteCategory(categoryId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Category deleted successfully!");
      loadCategories();
    }
  };

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    setCreating(true);
    const result = await createCategory(newCategoryName.trim(), newCategoryColor);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Category created successfully!");
      setNewCategoryName("");
      setNewCategoryColor("#3b82f6");
      setShowAddForm(false);
      loadCategories();
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <p className="text-slate-500 dark:text-slate-400">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Manage Categories
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {hasValidPremium
              ? "Create and manage your custom categories"
              : `Free users can create up to 3 categories. You have ${categories.length}/3.`}
          </p>
        </div>
        {hasValidPremium && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        )}
      </div>

      {/* Add New Category Form */}
      {showAddForm && hasValidPremium && (
        <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              New Category
            </h4>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewCategoryName("");
                setNewCategoryColor("#3b82f6");
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Strategic Supplier"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              disabled={creating}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-12 h-10 rounded border border-slate-300 dark:border-gray-600 cursor-pointer"
                disabled={creating}
              />
              <div className="flex gap-1 flex-wrap">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className="w-8 h-8 rounded border-2 border-slate-300 dark:border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    disabled={creating}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !newCategoryName.trim()}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? "Creating..." : "Create Category"}
          </button>
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="p-6 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            No custom categories yet. {hasValidPremium ? "Create one to get started!" : "Upgrade to Premium to create custom categories."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700"
            >
              {editingId === category.id ? (
                <>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-gray-600 flex-shrink-0"
                    style={{ backgroundColor: editColor }}
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-10 h-10 rounded border border-slate-300 dark:border-gray-600 cursor-pointer"
                  />
                  <button
                    onClick={() => handleSaveEdit(category.id)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-gray-600 flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
                    {category.name}
                  </span>
                  {hasValidPremium && (
                    <>
                      <button
                        onClick={() => handleStartEdit(category)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

