"use client";

import React, { createContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("AuthProvider: Checking Firebase auth state...");
    
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log("Auth state changed:", currentUser ? currentUser.email : "logged out");
        setUser(currentUser);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err: any) {
      console.error("Auth state change error:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Attempting sign up with:", email);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Sign up successful:", result.user.email);
    } catch (err: any) {
      console.error("Sign up error:", err.code, err.message);
      setError(err.message);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in with:", email);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign in successful:", result.user.email);
    } catch (err: any) {
      console.error("Sign in error:", err.code, err.message);
      setError(err.message);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("Attempting Google sign in...");
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign in successful:", result.user.email);
    } catch (err: any) {
      console.error("Google sign in error:", err.code, err.message);
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out...");
      setError(null);
      await signOut(auth);
      console.log("Logged out successfully");
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
