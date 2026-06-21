"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastVariant = "default" | "error" | "success";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: Toast[];
  add: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (t) =>
    set((s) => {
      // Avoid stacking duplicate messages.
      if (s.toasts.some((x) => x.title === t.title)) return s;
      return { toasts: [...s.toasts, { ...t, id: Date.now() + Math.random() }] };
    }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative API: const { toast } = useToast(); toast({ title, variant }). */
export function useToast() {
  const add = useToastStore((s) => s.add);
  return {
    toast: (opts: { title: string; description?: string; variant?: ToastVariant }) =>
      add({ variant: "default", ...opts }),
  };
}

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), 5000);
    return () => clearTimeout(t);
  }, [toast.id, dismiss]);

  const Icon = toast.variant === "success" ? CheckCircle2 : AlertTriangle;
  const accent =
    toast.variant === "error"
      ? "border-red/50 text-red"
      : toast.variant === "success"
        ? "border-green/50 text-green"
        : "border-border text-text";

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-3 rounded-lg border bg-surface-2 p-3 shadow-lg",
        accent
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs text-muted">{toast.description}</p>}
      </div>
      <button onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="text-muted hover:text-text">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Renders the live toast stack; mount once in the root layout. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
