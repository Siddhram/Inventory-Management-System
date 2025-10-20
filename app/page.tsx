"use client";

import { useAuth } from "@/lib/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);
  if (!user) return null; // wait for auth
  return (
    <div className="min-h-screen bg-white p-8">
      <header className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="text-xl font-semibold">
          <span className="text-gray-900">Software</span>
          <span className="text-orange-600">.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:inline">{user?.displayName || user?.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-5xl mx-auto mt-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold">
          Welcome to <span className="text-orange-600">Software</span>
        </h1>
        <p className="mt-3 text-gray-600">You are logged in.</p>
      </main>
    </div>
  );
}

function LogoutButton() {
  const { signOutUser } = useAuth();
  return (
    <button onClick={signOutUser} className="px-3 py-1.5 rounded-md border border-orange-500 text-orange-600 hover:bg-orange-50">
      Sign out
    </button>
  );
}
