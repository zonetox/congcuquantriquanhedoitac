"use client";

import { useState } from "react";
import { Shield, Users, Globe, Calendar, Search, Edit2, Trash2, X } from "lucide-react";
import { getDomainFromUrl, getFaviconUrl } from "@/lib/utils/url";
import Image from "next/image";
import type { Profile } from "@/lib/profiles/types";
import { UserManagement } from "@/components/admin/UserManagement";
import { updateProfile, deleteProfileAsAdmin } from "@/lib/admin/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AdminDashboardProps {
  profiles: Profile[];
  error?: string | null;
}

type Tab = "profiles" | "users";

export function AdminDashboard({ profiles, error }: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profiles");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Get unique user IDs for filter
  const uniqueUserIds = Array.from(new Set(profiles.map((p) => p.user_id)));

  // Filter profiles by search term and user
  const filteredProfiles = profiles.filter((profile) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      profile.title.toLowerCase().includes(searchLower) ||
      profile.url.toLowerCase().includes(searchLower) ||
      (profile.category && profile.category.toLowerCase().includes(searchLower));
    const matchesUser = !selectedUserId || profile.user_id === selectedUserId;
    return matchesSearch && matchesUser;
  });

  const handleStartEdit = (profile: Profile) => {
    setEditingProfileId(profile.id);
    setEditTitle(profile.title);
    setEditUrl(profile.url);
    setEditCategory(profile.category || "");
    setEditNotes(profile.notes || "");
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
    setEditTitle("");
    setEditUrl("");
    setEditCategory("");
    setEditNotes("");
  };

  const handleSaveEdit = async (profileId: string) => {
    const result = await updateProfile(profileId, {
      title: editTitle,
      url: editUrl,
      category: editCategory || undefined,
      notes: editNotes || undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Profile updated successfully!");
      setEditingProfileId(null);
      router.refresh();
    }
  };

  const handleDelete = async (profileId: string, profileTitle: string) => {
    if (!confirm(`Are you sure you want to delete profile "${profileTitle}"?`)) {
      return;
    }

    const result = await deleteProfileAsAdmin(profileId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Profile deleted successfully!");
      router.refresh();
    }
  };

  // Statistics
  const totalProfiles = profiles.length;
  const uniqueUsers = new Set(profiles.map((p) => p.user_id)).size;
  const profilesByCategory = profiles.reduce((acc, p) => {
    const cat = p.category || "General";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage users and profiles in the system
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("profiles")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "profiles"
                ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Profiles ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "users"
                ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Users ({uniqueUserIds.length})
          </button>
        </div>
      </div>

      {activeTab === "users" ? (
        <UserManagement />
      ) : (
        <>
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Profiles
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {totalProfiles}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Unique Users
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {uniqueUsers}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Categories
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {Object.keys(profilesByCategory).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search profiles by title, URL, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <select
            value={selectedUserId || ""}
            onChange={(e) => setSelectedUserId(e.target.value || null)}
            className="w-full md:w-auto px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Users</option>
            {uniqueUserIds.map((userId) => (
              <option key={userId} value={userId}>
                User: {userId.slice(0, 8)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    {searchTerm || selectedUserId ? "No profiles found matching your search." : "No profiles in the system yet."}
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {editingProfileId === profile.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Title"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                            placeholder="URL"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Category"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">
                            {profile.user_id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveEdit(profile.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Image
                              src={getFaviconUrl(profile.url)}
                              alt={getDomainFromUrl(profile.url)}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded"
                              loading="lazy"
                              unoptimized
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/favicon.ico";
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {profile.title}
                              </div>
                              {profile.notes && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                  {profile.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={profile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-xs"
                          >
                            {profile.url}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {profile.category || "General"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">
                            {profile.user_id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEdit(profile)}
                              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Edit Profile"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(profile.id, profile.title)}
                              className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(profilesByCategory).length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Profiles by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(profilesByCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {category}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

