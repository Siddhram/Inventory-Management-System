"use client";

import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!firstName || !surname || !mobile || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: `${firstName} ${surname}` });
      // save profile
      await setDoc(doc(db, "users", cred.user.uid), {
        firstName,
        surname,
        mobile,
        email,
        createdAt: new Date().toISOString(),
      });
  setSuccess("Account created!");
      setFirstName("");
      setSurname("");
      setMobile("");
      setEmail("");
  setPassword("");
      // Persist token immediately so middleware allows the redirect
      try {
        const token = await cred.user.getIdToken();
        if (token) {
          try { localStorage.setItem("authToken", token); } catch {}
          try { document.cookie = `authToken=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}`; } catch {}
        }
      } catch {}
      const next = search.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
    } catch (err: any) {
      setError(err?.message ?? "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md border border-orange-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-orange-600 mb-1">Create account</h1>
        <p className="text-sm text-gray-600 mb-4">Please provide your details to continue.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm text-gray-700">Name</label>
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label htmlFor="surname" className="block text-sm text-gray-700">Surname</label>
            <input
              id="surname"
              name="surname"
              autoComplete="family-name"
              required
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="Enter your surname"
            />
          </div>
          <div>
            <label htmlFor="mobile" className="block text-sm text-gray-700">Mobile number</label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              autoComplete="tel"
              required
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. +1 555 123 4567"
            />
          </div>
          <div>
            <label htmlFor="regEmail" className="block text-sm text-gray-700">Email</label>
            <input
              id="regEmail"
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
            <label htmlFor="regPassword" className="block text-sm text-gray-700">Password</label>
            <input
              id="regPassword"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <button disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2.5 rounded-md">
            {loading ? "Creating..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-700">
          Already have an account? <Link href="/auth/login" className="text-orange-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
