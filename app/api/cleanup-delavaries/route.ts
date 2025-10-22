import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getServerFirestoreDb } from "@/lib/firebaseServer";

export async function GET() {
  try {
    const db = getServerFirestoreDb();
    const now = Date.now();
    const q = query(
      collection(db, "delavaries"),
      where("expireAt", "<=", now)
    );
    const snapshot = await getDocs(q);
    let deleted = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const d of snapshot.docs) {
      const data = d.data() as any;
      const publicId = data?.cloudinaryPublicId || data?.publicId;
      try {
        if (!publicId) throw new Error("Missing Cloudinary publicId");
        await cloudinary.uploader.destroy(publicId);
      } catch (e: any) {
        errors.push({ id: d.id, error: e?.message || String(e) });
      }
      try {
        await deleteDoc(doc(db, "delavaries", d.id));
        deleted++;
      } catch (e: any) {
        errors.push({ id: d.id, error: e?.message || String(e) });
      }
    }

    return NextResponse.json({ status: "ok", checked: snapshot.size, deleted, errors });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Cleanup failed" },
      { status: 500 }
    );
  }
}
