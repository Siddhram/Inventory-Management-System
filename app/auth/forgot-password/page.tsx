"use client";

import { FormEvent, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import Link from "next/link";
import type { FirebaseError } from "firebase/app";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
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
      try { auth.languageCode = navigator?.language || "en"; } catch {}
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/login`,
        handleCodeInApp: false,
      } as const;
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSuccess("Password reset email sent. Please check your inbox and spam folder.");
    } catch (err: unknown) {
      const e = err as FirebaseError & { code?: string };
      let msg = "Failed to send reset email";
      switch (e?.code) {
        case "auth/invalid-email":
          msg = "The email address is invalid.";
          break;
        case "auth/user-not-found":
          msg = "No user found with this email.";
          break;
        case "auth/too-many-requests":
          msg = "Too many attempts. Please try again later.";
          break;
        case "auth/network-request-failed":
          msg = "Network error. Check your internet connection.";
          break;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md border border-orange-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-orange-600 mb-1">Forgot password</h1>
        <p className="text-sm text-gray-600 mb-4">Enter your email and we'll send you a reset link.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgotEmail" className="block text-sm text-gray-700">Email</label>
            <input
              id="forgotEmail"
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <button disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2.5 rounded-md">
            {loading ? "Sending..." : "Send reset email"}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-700">
          <Link href="/auth/login" className="text-orange-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
