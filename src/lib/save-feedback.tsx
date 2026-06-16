"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface PendingNav {
  href: string;
  action: () => void;
}

interface SaveFeedbackContextValue {
  isDirty: boolean;
  notifySaved: (message?: string) => void;
  registerDirty: (id: string, dirty: boolean) => void;
  requestNavigation: (href: string, action: () => void) => void;
  confirmIfDirty: (action: () => void) => void;
}

const SaveFeedbackContext = createContext<SaveFeedbackContextValue | null>(null);

function isInternalHref(href: string): boolean {
  if (!href || href.startsWith("#")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (href.startsWith("/")) return true;
  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function SaveFeedbackProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dirtyMap = useRef(new Map<string, boolean>());
  const [dirtyVersion, setDirtyVersion] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirty = useMemo(() => {
    void dirtyVersion;
    for (const dirty of Array.from(dirtyMap.current.values())) {
      if (dirty) return true;
    }
    return false;
  }, [dirtyVersion]);

  const registerDirty = useCallback((id: string, dirty: boolean) => {
    const prev = dirtyMap.current.get(id) ?? false;
    if (prev === dirty) return;
    if (dirty) dirtyMap.current.set(id, true);
    else dirtyMap.current.delete(id);
    setDirtyVersion((v) => v + 1);
  }, []);

  const notifySaved = useCallback((message = "Saved") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const requestNavigation = useCallback((href: string, action: () => void) => {
    if (!isDirty) {
      action();
      return;
    }
    setPendingNav({ href, action });
  }, [isDirty]);

  const confirmIfDirty = useCallback((action: () => void) => {
    requestNavigation("", action);
  }, [requestNavigation]);

  const confirmLeave = useCallback(() => {
    if (!pendingNav) return;
    const { action } = pendingNav;
    setPendingNav(null);
    action();
  }, [pendingNav]);

  const cancelLeave = useCallback(() => {
    setPendingNav(null);
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isDirty) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.dataset.guardNav === "skip") return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || !isInternalHref(href)) return;

      e.preventDefault();
      e.stopPropagation();

      const path = href.startsWith("/")
        ? href
        : new URL(href, window.location.origin).pathname +
          new URL(href, window.location.origin).search +
          new URL(href, window.location.origin).hash;

      requestNavigation(path, () => {
        if (path.startsWith("http")) {
          window.location.href = path;
        } else {
          router.push(path);
        }
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isDirty, requestNavigation, router]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const value = useMemo(
    () => ({ isDirty, notifySaved, registerDirty, requestNavigation, confirmIfDirty }),
    [isDirty, notifySaved, registerDirty, requestNavigation, confirmIfDirty]
  );

  return (
    <SaveFeedbackContext.Provider value={value}>
      {children}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 bg-positive-deep text-canvas text-sm font-semibold rounded-pill px-5 py-2.5 shadow-lg"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {toast}
        </div>
      )}

      {pendingNav && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-ink/40">
          <div
            role="alertdialog"
            aria-labelledby="unsaved-title"
            aria-describedby="unsaved-desc"
            className="w-full max-w-sm rounded-2xl bg-canvas border border-ink/10 shadow-xl p-5"
          >
            <h2 id="unsaved-title" className="text-lg font-bold text-ink">
              Unsaved changes
            </h2>
            <p id="unsaved-desc" className="text-sm text-body mt-2">
              You have edited fields that are not saved yet. Leave this page without saving?
            </p>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={cancelLeave}
                className="flex-1 rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:border-green"
              >
                Stay on page
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="flex-1 rounded-xl bg-negative/90 text-canvas px-4 py-2.5 text-sm font-semibold hover:bg-negative"
              >
                Leave anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </SaveFeedbackContext.Provider>
  );
}

export function useSaveFeedback() {
  const ctx = useContext(SaveFeedbackContext);
  if (!ctx) {
    throw new Error("useSaveFeedback must be used within SaveFeedbackProvider");
  }
  return ctx;
}

/** Register whether this component has unsaved edits (cleared on unmount). */
export function useUnsavedChanges(dirty: boolean) {
  const { registerDirty } = useSaveFeedback();
  const id = useId();

  useEffect(() => {
    registerDirty(id, dirty);
    return () => registerDirty(id, false);
  }, [dirty, id, registerDirty]);
}

/** Router push/replace that prompts when there are unsaved changes. */
export function useGuardedNavigation() {
  const { requestNavigation } = useSaveFeedback();
  const router = useRouter();

  const push = useCallback(
    (href: string) => {
      requestNavigation(href, () => router.push(href));
    },
    [requestNavigation, router]
  );

  const replace = useCallback(
    (href: string) => {
      requestNavigation(href, () => router.replace(href));
    },
    [requestNavigation, router]
  );

  return { push, replace };
}
