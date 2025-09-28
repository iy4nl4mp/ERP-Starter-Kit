"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import axios from "axios";

type Profile = {
  id: number;
  name: string;
  email: string;
  role_id?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Change password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [changeMessage, setChangeMessage] = useState<string | null>(null);

// Tabs: 'profile' (view), 'edit', 'password'
const [tab, setTab] = useState<'profile' | 'edit' | 'password'>('profile');
  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/profile")
      .then((res) => {
        if (!active) return;
        const p = res.data as Profile;
        setProfile(p);
        setName(p.name);
        setEmail(p.email);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load profile");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setError(null);

    try {
      await api.put("/profile", { name, email });
      setSaveMessage("Profile updated successfully");
      setProfile((prev) => (prev ? { ...prev, name, email } : prev));
    } catch (err: unknown) {
      let message = "Failed to update profile";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { messages?: { error?: string }; error?: string };
        message = data?.messages?.error ?? data?.error ?? err.message ?? message;
      } else if (err instanceof Error) {
        message = err.message ?? message;
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChanging(true);
    setChangeMessage(null);
    setError(null);

    try {
      await api.put("/profile/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setChangeMessage("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      let message = "Failed to change password";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { messages?: { error?: string }; error?: string };
        message = data?.messages?.error ?? data?.error ?? err.message ?? message;
      } else if (err instanceof Error) {
        message = err.message ?? message;
      }
      setError(message);
    } finally {
      setChanging(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="max-w-2xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-semibold">Profile</h1>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && profile && (
          <>
            {/* Tabs navigation */}
            <div className="flex gap-2 border-b pb-2">
              <button
                onClick={() => setTab('profile')}
                className={`px-3 py-1.5 text-sm rounded ${tab === 'profile' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                aria-pressed={tab === 'profile'}
              >
                Profile
              </button>
              <button
                onClick={() => setTab('edit')}
                className={`px-3 py-1.5 text-sm rounded ${tab === 'edit' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                aria-pressed={tab === 'edit'}
              >
                Edit Profile
              </button>
              <button
                onClick={() => setTab('password')}
                className={`px-3 py-1.5 text-sm rounded ${tab === 'password' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                aria-pressed={tab === 'password'}
              >
                Change Password
              </button>
            </div>

            {/* Tab: Profile (view) */}
            {tab === 'profile' && (
              <section className="space-y-2 pt-3">
                <h2 className="text-xl font-medium">Current Info</h2>
                <div className="text-gray-700">
                  <div><span className="font-medium">Name:</span> {profile.name}</div>
                  <div><span className="font-medium">Email:</span> {profile.email}</div>
                  {profile.role_id !== undefined && (
                    <div><span className="font-medium">Role ID:</span> {profile.role_id}</div>
                  )}
                  {profile.created_at && (
                    <div><span className="font-medium">Created:</span> {profile.created_at}</div>
                  )}
                  {profile.updated_at && (
                    <div><span className="font-medium">Updated:</span> {profile.updated_at}</div>
                  )}
                </div>
              </section>
            )}

            {/* Tab: Edit Profile */}
            {tab === 'edit' && (
              <section className="pt-3">
                <h2 className="text-xl font-medium mb-3">Edit Profile</h2>
                <form className="space-y-4" onSubmit={onSaveProfile}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none"
                      required
                    />
                  </div>
                  {saveMessage && <p className="text-green-600">{saveMessage}</p>}
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </form>
              </section>
            )}

            {/* Tab: Change Password */}
            {tab === 'password' && (
              <section className="pt-3">
                <h2 className="text-xl font-medium mb-3">Change Password</h2>
                <form className="space-y-4" onSubmit={onChangePassword}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Old Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none"
                      required
                    />
                  </div>
                  {changeMessage && <p className="text-green-600">{changeMessage}</p>}
                  <button
                    type="submit"
                    disabled={changing}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md disabled:opacity-50"
                  >
                    {changing ? "Changing..." : "Change Password"}
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
