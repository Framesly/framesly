"use client"

import { AnimatePresence, motion } from "motion/react"
import { createContext, useCallback, useContext, useRef, useState } from "react"

type Toast = { id: number; title: string; body?: string; tone?: "neutral" | "success" | "error" }

const ToastContext = createContext<(t: Omit<Toast, "id">) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

/** Minimal toasts, for the gallery and the app. State is always in the words, never colour alone. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const next = useRef(0)

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++next.current
    setToasts((all) => [...all.slice(-2), { ...t, id }])
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 3600)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-(--z-toast) flex flex-col items-center gap-2 px-4 pb-[env(safe-area-inset-bottom)]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface-overlay px-4 py-3 text-ink shadow-float"
            >
              <span aria-hidden className={`mt-2 size-1.5 shrink-0 rounded-full ${t.tone === "success" ? "bg-success" : t.tone === "error" ? "bg-danger" : "bg-safelight"}`} />
              <div>
                <p className="type-caption text-ink">{t.title}</p>
                {t.body && <p className="mt-0.5 type-caption font-normal text-ink-muted">{t.body}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
