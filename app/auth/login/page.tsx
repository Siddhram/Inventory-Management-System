"use client";

import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
  const auth = getFirebaseAuth();
  await signInWithEmailAndPassword(auth, email, password);
  // Persist token immediately so middleware allows the redirect
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      try { localStorage.setItem("authToken", token); } catch {}
      try { document.cookie = `authToken=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}`; } catch {}
    }
  } catch {}
  const next = search.get("next");
  router.replace(next && next.startsWith("/") ? next : "/");
    } catch (err: any) {
      setError(err?.message ?? "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md border border-orange-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-orange-600 mb-1">Login</h1>
        <p className="text-sm text-gray-600 mb-4">Welcome back. Please enter your details.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-gray-700">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2.5 rounded-md">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        <div className="mt-4 flex justify-between text-sm text-gray-700">
          <Link href="/auth/forgot-password" className="text-orange-600 hover:underline">Forgot password?</Link>
          <Link href="/auth/register" className="text-orange-600 hover:underline">Create account</Link>
        </div>
      </div>
    </div>
  );
}
