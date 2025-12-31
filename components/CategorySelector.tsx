"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { getCategories, createCategory } from "@/lib/categories/actions";
import { toast } from "sonner";
import type { Category } from "@/lib/categories/actions";

interface CategorySelectorProps {
  value: string;
  onChange: (categoryName: string) => void;
  isPremium: boolean;
  disabled?: boolean;
}

const DEFAULT_CATEGORIES = [
  { name: "General", color: "#64748b" },
  { name: "Competitor", color: "#ef4444" },
  { name: "Partner", color: "#10b981" },
  { name: "Customer", color: "#3b82f6" },
  { name: "Other", color: "#8b5cf6" },
];

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

export function CategorySelector({
  value,
  onChange,
  isPremium,
  disabled = false,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [creating, setCreating] = useState(false);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      const result = await getCategories();
      if (result.error) {
        toast.error(result.error);
      } else {
        setCategories(result.data || []);
      }
      setLoading(false);
    }
    loadCategories();
  }, []);

  // Combine default categories with user categories
  const allCategories = [
    ...DEFAULT_CATEGORIES.map((cat) => ({
      name: cat.name,
      color: cat.color,
      isDefault: true,
    })),
    ...categories.map((cat) => ({
      name: cat.name,
      color: cat.color,
      isDefault: false,
    })),
  ];

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    setCreating(true);
    const result = await createCategory(newCategoryName.trim(), newCategoryColor);

    if (result.error) {
      toast.error(result.error);
      setCreating(false);
      return;
    }

    if (result.data) {
      setCategories([...categories, result.data]);
      onChange(result.data.name);
      setNewCategoryName("");
      setNewCategoryColor("#3b82f6");
      setShowAddForm(false);
      toast.success("Category created successfully!");
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || !isPremium}
          className="flex-1 px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allCategories.map((cat) => (
            <option key={cat.name} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        {isPremium && !disabled && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            title="Add New Category"
          >
            <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        )}
      </div>

      {/* Selected category color indicator */}
      {value && (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-slate-300 dark:border-gray-600"
            style={{
              backgroundColor:
                allCategories.find((cat) => cat.name === value)?.color || "#64748b",
            }}
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {allCategories.find((cat) => cat.name === value)?.name}
          </span>
        </div>
      )}

      {/* Add New Category Form */}
      {showAddForm && isPremium && (
        <div className="p-4 border border-slate-300 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Add New Category
            </h4>
            <button
              type="button"
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
            type="button"
            onClick={handleCreateCategory}
            disabled={creating || !newCategoryName.trim()}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? "Creating..." : "Create Category"}
          </button>
        </div>
      )}

      {!isPremium && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Free users can only select &quot;General&quot;. Upgrade to Premium to create custom categories.
        </p>
      )}
    </div>
  );
}

