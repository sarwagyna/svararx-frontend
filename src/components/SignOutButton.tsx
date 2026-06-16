"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearTokens } from "@/lib/tokens";
import { clearClinicSessionState } from "@/lib/clinic-session";
import { useState } from "react";
import { clsx } from "clsx";

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="w-5 h-5 shrink-0"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

/** Full account sign-out (email / Supabase session). */
export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      clearTokens();
      clearClinicSessionState();
      sessionStorage.removeItem("svararx_practice_mode_chosen");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={clsx(
        "w-full flex items-center gap-3 text-sm font-semibold px-4 py-3 rounded-xl transition-colors",
        "border border-negative/35 text-negative bg-negative/5",
        "hover:bg-negative/10 hover:border-negative/50",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      title="Sign out of your account completely"
    >
      <LogoutIcon />
      {loading ? "Signing out…" : label}
    </button>
  );
}
