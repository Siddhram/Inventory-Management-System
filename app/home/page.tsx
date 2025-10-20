"use client";

import { useAuth } from "@/lib/AuthContext";
import { redirect } from "next/navigation";

export default function HomePage() {
  const { user, loading, signOutUser } = useAuth();
  if (!loading && !user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-white p-8">
      <header className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="text-xl font-semibold">
          <span className="text-gray-900">Software</span>
          <span className="text-orange-600">.</span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">{user.displayName || user.email}</span>
            <button onClick={signOutUser} className="px-3 py-1.5 rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50">
              Sign out
            </button>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto mt-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold">
          Welcome to <span className="text-orange-600">Software</span>
        </h1>
        <p className="mt-3 text-gray-600">You are logged in.</p>
      </main>
    </div>
  );
}
