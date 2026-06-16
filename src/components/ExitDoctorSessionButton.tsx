"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { exitDoctorSession } from "@/lib/clinic-session";

function ExitIcon() {
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
        d="M11 16l-4-4m0 0l4-4m-4 4h14M7 20H5a2 2 0 01-2-2V6a2 2 0 012-2h2"
      />
    </svg>
  );
}

export function ExitDoctorSessionButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleExit = () => {
    setLoading(true);
    exitDoctorSession();
    router.push("/clinic");
  };

  return (
    <button
      type="button"
      onClick={handleExit}
      disabled={loading}
      className={clsx(
        "w-full flex items-center gap-3 text-sm font-semibold px-4 py-3 rounded-xl transition-colors",
        "border border-ink/20 text-ink bg-canvas-soft",
        "hover:bg-canvas hover:border-ink/30",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      title="Return to clinic dashboard"
    >
      <ExitIcon />
      {loading ? "Returning…" : "Exit to clinic"}
    </button>
  );
}
