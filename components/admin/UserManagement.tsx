"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Save, X, Crown, User, Shield } from "lucide-react";
import { getAllUsers, updateUser, deleteUser } from "@/lib/admin/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  email: string | null;
  role: string;
  is_premium: boolean;
  trial_started_at: string | null;
  updated_at: string;
}

export function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"user" | "admin">("user");
  const [editPremium, setEditPremium] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const result = await getAllUsers();
    if (result.error) {
      toast.error(result.error);
    } else {
      setUsers(result.data || []);
    }
    setLoading(false);
  }

  const handleStartEdit = (user: UserData) => {
    setEditingId(user.id);
    setEditEmail(user.email || "");
    setEditRole(user.role === "admin" ? "admin" : "user");
    setEditPremium(user.is_premium);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditEmail("");
    setEditRole("user");
    setEditPremium(false);
  };

  const handleSaveEdit = async (userId: string) => {
    const result = await updateUser(userId, {
      email: editEmail || undefined,
      role: editRole,
      is_premium: editPremium,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User updated successfully!");
      setEditingId(null);
      loadUsers();
      router.refresh();
    }
  };

  const handleDelete = async (userId: string, userEmail: string | null) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail || userId}"? This will delete all their data (profiles, categories, etc.).`)) {
      return;
    }

    const result = await deleteUser(userId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User deleted successfully!");
      loadUsers();
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <p className="text-slate-500 dark:text-slate-400">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          User Management
        </h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Total: {users.length} users
        </div>
      </div>

      {users.length === 0 ? (
        <div className="p-6 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 text-center">
          <p className="text-slate-500 dark:text-slate-400">No users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Premium
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                  {editingId === user.id ? (
                    <>
                      <td className="px-4 py-4">
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as "user" | "admin")}
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editPremium}
                            onChange={(e) => setEditPremium(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Premium</span>
                        </label>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(user.id)}
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
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-4 text-sm text-slate-900 dark:text-white">
                        {user.email || "N/A"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}>
                          {user.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {user.is_premium ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900">
                            <Crown className="w-3 h-3" />
                            Premium
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-400">Free</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.email)}
                            className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

