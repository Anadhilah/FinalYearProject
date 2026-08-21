/* eslint-disable react-refresh/only-export-components */
import { supabase } from "@/lib/supabaseClient";
import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

export type UserRole = "student" | "recruiter" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isApproved?: boolean;
  recruiterStatus?: string;
  emailVerified?: boolean;
  company?: string | null;
  industry?: string | null;
  companyAddress?: string | null;
  registrationNumber?: string | null;
  proofDocUrl?: string | null;
  hrName?: string | null;
  hrEmail?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "student" | "recruiter",
    extra?: {
      company?: string;
      industry?: string;
      registrationNumber?: string;
      proofDocUrl?: string;
    }
  ) => Promise<User>;
logout: () => void;
  refreshUser: () => Promise<User | null>;
  isAuthenticated: boolean;
}

interface RawUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved?: boolean;
  recruiterStatus?: string;
  emailVerified?: boolean;
  company?: string | null;
  industry?: string | null;
  companyAddress?: string | null;
  registrationNumber?: string | null;
  proofDocUrl?: string | null;
  hrName?: string | null;
  hrEmail?: string | null;
}

const mapRawUser = (raw: RawUser | null | undefined): User => ({
  id: raw?.id ?? "",
  name: raw?.name ?? "User",
  email: raw?.email ?? "",
  role: (raw?.role ?? "student").toLowerCase() as UserRole,
  isApproved: raw?.isApproved,
  recruiterStatus: raw?.recruiterStatus?.toLowerCase?.(),
  emailVerified: raw?.emailVerified,
  company: raw?.company,
  industry: raw?.industry,
  companyAddress: raw?.companyAddress,
  registrationNumber: raw?.registrationNumber,
  proofDocUrl: raw?.proofDocUrl,
  hrName: raw?.hrName,
  hrEmail: raw?.hrEmail,
});

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("ic_user");
    return stored ? JSON.parse(stored) : null;
  });
  const registrationInProgress = useRef(false);

  const persistUser = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("ic_user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("ic_user");
    }
  };

const fetchProfile = async (userId: string, authUser?: { email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) => {
    const { data, error } = await supabase
      .from("User")
      .select(
        "id, name, email, role, isApproved, recruiterStatus, emailVerified, company, industry, companyAddress, registrationNumber, proofDocUrl, hrName, hrEmail"
      )
      .eq("id", userId)
      .single();

if (error) {
      // PGRST116 = no row found (.single() with zero rows). PostgREST also
      // returns HTTP 406 "Not Acceptable" when .single() finds zero rows, so
      // treat both as a missing profile and let loadUser self-heal.
      if (error.code === "PGRST116" || error.code === "406") {
        return null;
      }

      // RLS / permission errors mean access is blocked (not a missing row).
      // Surface these so the caller doesn't silently misroute the user.
      if (error.message?.includes("row-level security") || error.message?.includes("permission denied")) {
        throw new Error(
          "Could not determine user role. Your account profile may not exist or read access is blocked by row-level security."
        );
      }

      throw error;
    }

    return data ?? null;
  };

const loadUser = async (userId: string) => {
const authResponse = await supabase.auth.getUser();
    const authUser = authResponse.data?.user;
    let profile: RawUser | null = await fetchProfile(userId, authUser) as RawUser | null;

    // Self-heal: if the profile row is missing (e.g. registration insert failed
    // or the user was created directly in Supabase Auth), create it from the
    // auth session so the user can log in instead of getting a 406 error.
    if (!profile) {
      const metaRole = authUser?.app_metadata?.role ?? authUser?.user_metadata?.role;
      const metaRoleString =
        typeof metaRole === "string" && metaRole.trim() !== "" ? metaRole : "STUDENT";
      const name =
        typeof authUser?.user_metadata?.name === "string"
          ? authUser.user_metadata.name
          : authUser?.email?.split("@")[0] ?? "User";

      const newProfile: RawUser = {
        id: userId,
        email: authUser?.email ?? "",
        name,
        role: metaRoleString,
        isApproved: false,
        emailVerified: authUser?.email_confirmed_at != null,
        recruiterStatus: null,
        company: null,
        industry: null,
        companyAddress: null,
        registrationNumber: null,
        proofDocUrl: null,
        hrName: null,
        hrEmail: null,
      };

try {
        // Prefer the SECURITY DEFINER RPC (bypasses RLS) to reliably ensure the
        // profile row exists. Plain inserts/upserts over the table can fail
        // with 406/409 when auth.uid() is unreliable or RLS hides the row.
        const { data: rpcResult, error: upsertError } = await supabase.rpc(
          "ensure_user_profile",
          {
            p_id: userId,
            p_email: authUser?.email ?? "",
            p_name: name,
            p_role: metaRoleString,
            p_is_approved: false,
            p_email_verified: authUser?.email_confirmed_at != null,
            p_recruiter_status: null,
            p_company: null,
            p_industry: null,
            p_registration_number: null,
            p_proof_doc_url: null,
          }
        );
        if (upsertError) throw upsertError;
        profile = (rpcResult as RawUser | null | undefined) ?? null;
      } catch (rpcError) {
        // The RPC may not exist in the database yet (404) or may be blocked by
        // permissions. Fall back to a direct insert, which is allowed by the
        // "Users insert own profile" RLS policy (row id == auth.uid()).
        console.debug("ensure_user_profile RPC failed, falling back to direct insert:", rpcError);
        try {
          const { data: inserted, error: insertError } = await supabase
            .from("User")
            .insert({
              id: userId,
              email: authUser?.email ?? "",
              name,
              role: metaRoleString,
              isApproved: false,
              emailVerified: authUser?.email_confirmed_at != null,
              recruiterStatus: null,
              company: null,
              industry: null,
              registrationNumber: null,
              proofDocUrl: null,
            })
            .select()
            .maybeSingle();
          if (insertError) throw insertError;
          profile = (inserted as RawUser | null | undefined) ?? null;
        } catch (insertError) {
          console.debug("Failed to insert user profile row:", insertError);
          profile = null;
        }
      }

      // CRITICAL: verify the row was actually persisted. If not, the user's
      // profile row is missing from the "User" table, which will cause child
      // inserts (e.g. "Application") to fail with a foreign-key violation.
      // Re-fetch via RLS to confirm the row is now visible to the session.
      if (profile) {
        const verified = await fetchProfile(userId, authUser);
        profile = verified;
      }
    }

if (!profile) {
      throw new Error(
        "Could not load user profile and failed to create one. Your account profile row is missing from the database. Please run the SQL in supabase/migrations/20240101_ensure_profile_rls.sql in the Supabase SQL editor, then contact support if it persists."
      );
    }

    const emailVerified = authUser?.email_confirmed_at != null || profile.emailVerified === true;
    if (emailVerified && profile.emailVerified === false) {
      try {
        await supabase.from("User").update({ emailVerified: true }).eq("id", userId);
        profile.emailVerified = true;
      } catch (updateError) {
        console.debug("Failed to update email verification flag:", updateError);
      }
    }

    const userData = mapRawUser(profile);
    persistUser(userData);
    return userData;
  };

  useEffect(() => {
const initialize = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.debug("Supabase session initialization failed:", error);
        return;
      }

      if (session?.user?.id) {
        try {
          await loadUser(session.user.id);
        } catch (err) {
          console.debug("Failed to load Supabase user profile:", err);
        }
      }
    };

    initialize();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (registrationInProgress.current && session?.user?.id) return;

      if (session?.user?.id) {
        try {
          await loadUser(session.user.id);
        } catch (err) {
          console.debug("Auth state user load failed:", err);
        }
} else if (event === "SIGNED_OUT") {
        persistUser(null);
      }
    });

    return () => {
      data.subscription?.unsubscribe();
    };
  }, []);

  const refreshUser = async (): Promise<User | null> => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user?.id) {
      return null;
    }

    try {
      return await loadUser(session.user.id);
    } catch (err) {
      console.debug("Failed to refresh Supabase user:", err);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login error:", error);
      throw error;
    }

    if (!data.user?.id) {
      throw new Error("Login succeeded but no user session was returned.");
    }

    return loadUser(data.user.id);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "student" | "recruiter",
    extra?: {
      company?: string;
      industry?: string;
      registrationNumber?: string;
      proofDocUrl?: string;
    }
  ) => {
    registrationInProgress.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: role.toUpperCase() },
        },
      });
      if (error) {
        console.error("Registration error:", error);
        throw error;
      }

      if (!data.user?.id) {
        throw new Error("Registration succeeded but no user id was returned.");
      }

      const profilePayload = {
        id: data.user.id,
        email,
        name,
        role: role.toUpperCase(),
        isApproved: false,
        emailVerified: true,
        recruiterStatus: role === "recruiter" ? "PENDING" : null,
        company: extra?.company ?? null,
        industry: extra?.industry ?? null,
        registrationNumber: extra?.registrationNumber ?? null,
        proofDocUrl: extra?.proofDocUrl ?? null,
      } as const;

    // Use the SECURITY DEFINER RPC (bypasses RLS) so registration reliably
    // creates/adopts the profile row without 409 conflicts with the
    // handle_new_user trigger.
      const { data: rpcProfile, error: insertError } = await supabase.rpc(
        "ensure_user_profile",
        {
          p_id: data.user.id,
          p_email: email,
          p_name: name,
          p_role: role.toUpperCase(),
          p_is_approved: false,
          p_email_verified: true,
          p_recruiter_status: role === "recruiter" ? "PENDING" : null,
          p_company: extra?.company ?? null,
          p_industry: extra?.industry ?? null,
          p_registration_number: extra?.registrationNumber ?? null,
          p_proof_doc_url: extra?.proofDocUrl ?? null,
        }
      );
      if (insertError) {
        console.error("Failed to create user profile row:", insertError);
        throw insertError;
      }
      const userData = mapRawUser((rpcProfile ?? profilePayload) as RawUser);
      persistUser(userData);
      return userData;
    } finally {
      registrationInProgress.current = false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    persistUser(null);
    localStorage.removeItem("ic_dev_verification_code");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}