"use client";

import { onIdTokenChanged, signOut, User, getIdToken } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { getFirebaseAuth } from "./firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOutUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onIdTokenChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const token = await getIdToken(u, true);
          // Save token for middleware checks and client needs
          try {
            localStorage.setItem("authToken", token);
          } catch {}
          try {
            document.cookie = `authToken=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}`; // 7 days
          } catch {}
        } catch {}
      } else {
        try { localStorage.removeItem("authToken"); } catch {}
        try { document.cookie = "authToken=; Path=/; Max-Age=0"; } catch {}
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signOutUser = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    try { localStorage.removeItem("authToken"); } catch {}
    try { document.cookie = "authToken=; Path=/; Max-Age=0"; } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
