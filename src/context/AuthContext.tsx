/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Auth Context Type Definition
 */
type AuthContextType = {
  token: string | null;
  user: any | null; // Keeping user as any for flexibility or should be User?
  role: 'admin' | 'user' | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string }) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
};

// Create context with null default
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth Provider Component
 * 
 * Manages the global authentication state via Supabase.
 * Listens for auth state changes (login, logout, token refresh) 
 * and provides state to the entire app.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Initial session check on mount
     */
    const initAuth = async () => {
      console.log("[AuthContext] Initializing auth state...");
      try {
        // Retrieve existing session from storage/cookies via Supabase helper
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { session } } = await (supabase.auth as any).getSession();
        setToken(session?.access_token || null);
        setUser(session?.user || null);

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          setRole(profile?.role || 'user');
        }

        console.log("[AuthContext] Initial session check complete. Authenticated:", !!session?.access_token);
      } catch (error) {
        console.error('[AuthContext] Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    /**
     * Set up real-time listener for Auth State Changes
     * Handles background token refreshes, login from other tabs, and manual logout.
     */
    const {
      data: { subscription },
    } = (supabase.auth as any).onAuthStateChange((event: string, session: any) => {
      console.log(`[AuthContext] Auth State Change: ${event}`);
      setToken(session?.access_token || null);
      setUser(session?.user || null);

      if (session?.user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setRole(data?.role || 'user'));
      } else {
        setRole(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("[AuthContext] Cleaning up auth subscription...");
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Helper: Manual Login
   */
  const login = async (email: string, password: string) => {
    console.log("[AuthContext] Attempting login for:", email);
    const { error } = await (supabase.auth as any).signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("[AuthContext] Login failed:", error.message);
      throw error;
    }
    console.log("[AuthContext] Login successful.");
  };

  /**
   * Helper: Update Profile
   */
  const updateProfile = async (data: { name?: string }) => {
    console.log("[AuthContext] Updating profile:", data);
    const { error } = await (supabase.auth as any).updateUser({
      data: { name: data.name }
    });
    if (error) throw error;
    console.log("[AuthContext] Profile updated.");
  };

  /**
   * Helper: Update Password
   */
  const updatePassword = async (password: string) => {
    console.log("[AuthContext] Updating password...");
    const { error } = await (supabase.auth as any).updateUser({
      password: password
    });
    if (error) throw error;
    console.log("[AuthContext] Password updated.");
  };

  /**
   * Helper: Reset Password
   */
  const resetPassword = async (email: string) => {
    console.log("[AuthContext] Sending password reset for:", email);
    const { error } = await (supabase.auth as any).resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard/profile`,
    });
    if (error) throw error;
    console.log("[AuthContext] Password reset email sent.");
  };

  /**
   * Helper: Global Logout
   */
  const logout = async () => {
    console.warn("[AuthContext] Logging out user...");
    await (supabase.auth as any).signOut();
    await (supabase.auth as any).signOut();
    setToken(null);
    setUser(null);
    setRole(null);
    console.log("[AuthContext] User logged out, session cleared.");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        login,
        logout,
        updateProfile,
        updatePassword,
        resetPassword,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to safely consume Auth state
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.error("[AuthContext] Hook used outside of Provider!");
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};