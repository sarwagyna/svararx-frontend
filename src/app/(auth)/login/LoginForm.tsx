"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { resolvePostLoginPath } from "@/lib/auth-routing";
import { mapSupabaseAuthError } from "@/lib/auth-errors";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(mapSupabaseAuthError(authError));
      setLoading(false);
    } else {
      try {
        const next = searchParams.get("next");
        const path = await resolvePostLoginPath(next);
        router.refresh();
        router.push(path);
      } catch {
        setError("Could not sign in. Please try again.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-canvas rounded-xl p-8 shadow-sm">
        <h1
          className="text-ink mb-2"
          style={{ fontSize: 32, fontWeight: 600, lineHeight: "38.4px", letterSpacing: "-0.96px" }}
        >
          Welcome back
        </h1>
        <p className="text-base text-body mb-8">Sign in to your doctor account</p>

        {error && (
          <div className="mb-6 bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-sm text-negative">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.com"
              required
              autoComplete="email"
              className="w-full bg-canvas border border-ink rounded-md px-4 py-3 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full bg-canvas border border-ink rounded-md px-4 py-3 pr-11 text-base text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-green/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-body transition-colors"
              >
                <EyeIcon open={showPwd} />
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-body hover:text-ink underline underline-offset-2 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green text-ink font-semibold rounded-xl px-6 py-3 text-base hover:bg-green-hover active:bg-green-neutral transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-body mt-6">
        New to SvaraRx?{" "}
        <Link
          href="/signup"
          className="font-semibold text-ink hover:text-positive underline underline-offset-2 transition-colors"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
