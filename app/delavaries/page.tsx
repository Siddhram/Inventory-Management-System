"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import ThemeToggle from "@/app/components/ThemeToggle";

type Delavary = {
  id: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  notes?: string;
  createdAt?: any;
  expireAt?: number;
};

export default function DelavariesPage() {
  const db = useMemo(() => getFirestoreDb(), []);
  const [items, setItems] = useState<Delavary[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });
  const formRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void fetchItems();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dashboardTheme", theme);
    } catch {}
  }, [theme]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "delavaries"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: Delavary[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setItems(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load delavaries");
    } finally {
      setLoading(false);
    }
  };

  const onAdd = async () => {
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("Please select an image");
      return;
    }
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      setError("Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local");
      return;
    }
    setAdding(true);
    try {
      // 1) Upload to Cloudinary (unsigned)
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", uploadPreset);
      form.append("folder", "delavaries");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Failed to upload image to Cloudinary");
      const data = await res.json();
      const imageUrl: string = data.secure_url;
      const publicId: string = data.public_id;

      // 2) Save to Firestore
  const expireAt = Date.now() + 2 * 24 * 60 * 60 * 1000; // +48 hours (2 days)
      await addDoc(collection(db, "delavaries"), {
        imageUrl,
        cloudinaryPublicId: publicId,
        notes,
        createdAt: serverTimestamp(),
        expireAt,
      });

      setFile(null);
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
  setSuccess("Added successfully. Auto-deletes in 48 hours.");
      void fetchItems();
      // Hide form after a short delay so the user sees the success message
      setTimeout(() => {
        setShowForm(false);
        setSuccess(null);
      }, 800);
    } catch (e: any) {
      setError(e?.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={`min-h-screen p-4 sm:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header: stack on mobile, row on larger screens */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
          <h1 className={`text-2xl sm:text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Delavaries</h1>
          <div className="w-full sm:w-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
            {/* Add button triggers form section focus */}
            <button
              onClick={() => {
                setShowForm(true);
                // Wait for form to mount, then scroll and focus file input
                setTimeout(() => {
                  formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  fileInputRef.current?.focus();
                }, 50);
              }}
              className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add new entry
            </button>
          </div>
        </div>

        {/* Add section: image + notes */}
        {showForm && (
          <div ref={formRef} id="add-form" className={`border rounded-lg p-4 mb-8 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className={`text-lg font-semibold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Add new</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Image</label>
                {/* Gallery/file picker */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className={`block w-full text-sm ${theme === "dark" ? "text-white" : "text-black"}`}
                />
                {/* Hidden camera capture input (opens device camera when supported) */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className={`w-full sm:w-auto px-3 py-2 rounded-md ${theme === "dark" ? "bg-orange-900 text-orange-200 hover:bg-orange-800" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                  >
                    Take photo (camera)
                  </button>
                  <span className={`text-xs self-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Or choose from gallery above</span>
                </div>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full border rounded-md p-2 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white placeholder-gray-400" : "border-gray-300 text-black placeholder-gray-500"}`}
                  rows={3}
                  placeholder="Write a note..."
                />
              </div>
              {error && (
                <p className={`text-sm ${theme === "dark" ? "text-red-300" : "text-red-600"}`}>{error}</p>
              )}
              {success && (
                <p className={`text-sm ${theme === "dark" ? "text-green-300" : "text-green-600"}`}>{success}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={onAdd} disabled={adding} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50">
                  {adding ? "Uploading..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError(null);
                    setSuccess(null);
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    setNotes("");
                  }}
                  className={`w-full sm:w-auto px-4 py-2 rounded-md ${theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List: cards stack on mobile, image above content */}
        <div className="space-y-4">
          {loading ? (
            <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Loading...</p>
          ) : items.length === 0 ? (
            <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>No items yet.</p>
          ) : (
            items.map((it) => (
              <div key={it.id} className={`border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <img src={it.imageUrl} alt="delavary" className="w-full sm:w-48 h-56 sm:h-48 object-cover rounded" />
                <div className="flex-1">
                  <p className={`text-sm whitespace-pre-wrap wrap-break-word ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>{it.notes || "—"}</p>
                  <div className={`mt-2 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    <span>Auto-delete: {it.expireAt ? new Date(it.expireAt).toLocaleString() : "unknown"}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
