// Firebase initialization for server-side usage (API routes)
import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

function ensureInitialized() {
  if (!app) {
    const config = {
      apiKey: "AIzaSyAt7d7B0GABH1TShox3WllC4OX09WXjRE0",
      authDomain: "inventory-management-sys-df6db.firebaseapp.com",
      projectId: "inventory-management-sys-df6db",
      storageBucket: "inventory-management-sys-df6db.firebasestorage.app",
      messagingSenderId: "930328806269",
      appId: "1:930328806269:web:2ba5f5955b6027ba1f4214",
      measurementId: "G-HGRFET3RK7",
    } as const;
    app = getApps().length ? getApp() : initializeApp(config);
    db = getFirestore(app);
  }
}

export function getServerFirestoreDb(): Firestore {
  ensureInitialized();
  if (!db) throw new Error("Firestore (server) not initialized");
  return db;
}
