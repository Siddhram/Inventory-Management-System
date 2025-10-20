"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let persistenceConfigured = false;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Please set it in .env.local`);
  }
  return value;
}

function ensureInitialized() {
  if (!app) {
    const config = {
  apiKey: "AIzaSyAt7d7B0GABH1TShox3WllC4OX09WXjRE0",
  authDomain: "inventory-management-sys-df6db.firebaseapp.com",
  projectId: "inventory-management-sys-df6db",
  storageBucket: "inventory-management-sys-df6db.firebasestorage.app",
  messagingSenderId: "930328806269",
  appId: "1:930328806269:web:2ba5f5955b6027ba1f4214",
  measurementId: "G-HGRFET3RK7"
    } as const;
    app = getApps().length ? getApp() : initializeApp(config);
    auth = getAuth(app);
    if (!persistenceConfigured) {
      // Persist session in local storage until explicit logout
      void setPersistence(auth, browserLocalPersistence).then(() => {
        persistenceConfigured = true;
      }).catch(() => {
        // ignore; will use default if setting persistence fails
      });
    }
    db = getFirestore(app);
  }
}

export function getFirebaseAuth(): Auth {
  ensureInitialized();
  if (!auth) throw new Error("Firebase Auth not initialized");
  return auth;
}

export function getFirestoreDb(): Firestore {
  ensureInitialized();
  if (!db) throw new Error("Firestore not initialized");
  return db;
}
